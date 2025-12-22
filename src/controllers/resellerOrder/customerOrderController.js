const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const { customAlphabet } = require("nanoid");

const ComboModel = require("../../models/comboProduct/combo");

const customBarCode = customAlphabet("0123456789", 17);
const ResellerModel = require("../../models/user/reseller");
const OrderModel = require("../../models/resellerOrder/resellerOrder");
const OrderComboModel = require("../../models/resellerOrder/resellerOrderCombo");
const OrderComboProductModel = require("../../models/resellerOrder/resellerOrderComboProduct");
const ResellerOrderProductModel = require("../../models/resellerOrder/resellerOrderProducts");
const LogModel = require("../../models/helpers/log");
const CustomerModel = require("../../models/user/customer");
const ProductModel = require("../../models/product/product");
// const VariationModel = require("../../models/product/variation");
const { promoVerify } = require("../../helpers/promoQuery");
const customMetaData = require("../../helpers/customMetaData");
const { resellerOrderSerialNumber, getCustomerCharge } = require("../../helpers/shareFunc");
const PathaoCityModel = require("../../models/courierServices/pathao/pathaoCity");
const PathaoZoneModel = require("../../models/courierServices/pathao/pathaoZone");
const PromoModel = require("../../models/product/promo");

// const { pendingOrderMsg } = require("../../service/smsList");
// const smsSend = require("../../service/smsService");
const { resellerOrderPopulate } = require("../../helpers/allOrderQuery");
const initPayment = require("../../service/aamarPay/initiatePayment");

// const uploadImage = require("../../utils/upload-img");
// const VariationModel = require("../../models/product/variation");

const orderProjection = {
  serialId: 1,
  customerId: 1,
  products: 1,
  combos: 1,
  orderStatus: 1,
  customerNote: 1,
  payment: 1,
  deliveryAddress: 1,
  customerCharge: 1,
  deliverySiteCost: 1,
  adminRevenue: 1,
  createdBy: 1,
  createdAt: 1,
  isReturn: 1,
  isRefund: 1,
  updateHistory: 1,
  courierData: 1,
  courierInfo: 1,
  promoCode: 1,
};

// ================ ADMIN CUSTOMER ORDER ==============
// CREATE CUSTOMER ORDER
const createCustomerOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const MONGOOSE_ID = new mongoose.Types.ObjectId();
      if (req.user.role === "customer" && req.user._id !== req.body.customerId) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Unauthorize customer. Check it from frontend!",
        });
      }
      req.body.combos = []; // this will be delete future ***
      if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Must have one product or combo product!",
        });
      }

      const startTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const selectedProductIds = req.body.products.map((i) => ObjectId(i?.productId));
      const selectedComboProductIds = req.body.combos
        .map((item) => item?.products.map((prod) => ObjectId(prod?.productId)))
        .flat();

      const [
        resellerData,
        checkAllProducts,
        checkAllCombos,
        cityData,
        zoneData,
        checkCustomer,
        totalOrder,
        totalDuplicate,
        promoData,
        customerPromoUsed,
      ] = await Promise.all([
        ResellerModel.findOne(
          {
            _id: req.reseller._id,
          },
          {
            commission: 1,
          }
        ),
        ProductModel.aggregate([
          {
            $match: {
              $or: [
                {
                  _id: { $in: selectedProductIds },
                  isDeleted: false,
                  isReseller: true,
                },
                {
                  _id: { $in: selectedComboProductIds },
                  isDeleted: false,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "variations",
              localField: "variations",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    stock: 1,
                    sellingPrice: 1,
                    flashPrice: 1,
                  },
                },
              ],
              as: "variationData",
            },
          },
          {
            $project: {
              name: 1,
              weight: 1,
              isFlashDeal: 1,
              isVariant: 1,
              nonVariation: 1,
              variationData: 1,
              isReseller: 1,
              resellerDetails: 1,
            },
          },
        ]),
        ComboModel.find(
          {
            _id: { $in: req.body.combos.map((item) => ObjectId(item?.comboId)) },
          },
          {
            name: 1,
            sellingPrice: 1,
            products: 1,
            isReseller: 1,
            resellerDetails: 1,
          }
        ),
        PathaoCityModel.findOne({
          _id: req.body.deliveryAddress?.cityId ? ObjectId(req.body.deliveryAddress?.cityId) : null,
        }),
        PathaoZoneModel.findOne({
          _id: req.body.deliveryAddress?.zoneId ? ObjectId(req.body.deliveryAddress?.zoneId) : null,
        }),
        CustomerModel.findOne({
          userName: req.body.deliveryAddress.phone,
          resellerId: req.reseller._id,
        }),
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({
          "deliveryAddress.phone": req.body.deliveryAddress.phone,
          createdAt: { $gte: startTime },
        }),
        PromoModel.findOne({
          promo: req.body.promo === "" ? null : { $regex: `^${req.body.promo}$`, $options: "i" },
          isDisable: false,
        }),
        OrderModel.countDocuments({
          "resellerInfo.resellerId": req.reseller._id,
          "deliveryAddress.phone": req.body.deliveryAddress.phone,
          promoCode: { $regex: `^${req.body.promo}$`, $options: "i" },
        }),
      ]);

      if (req.body.deliveryAddress?.cityId && !cityData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid city data!",
        });
      }

      if (req.body.deliveryAddress?.zoneId && !zoneData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid zone data!",
        });
      }

      let totalWeight = 0;
      let sumOfTotalProductPrice = 0;
      let profitMoney = 0;
      let errorMessage = "";
      const allProducts = [];
      for (const product of req.body.products) {
        const foundProd = checkAllProducts.find(
          (i) => String(i?._id) === String(product?.productId)
        );

        // product check
        if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
          errorMessage = "There is some invalid products!";
          break;
        }

        if (!product?.isVariant) {
          // ... price ...
          if (
            !foundProd?.isFlashDeal &&
            Number(foundProd?.nonVariation?.sellingPrice) !== Number(product?.price)
          ) {
            errorMessage = `${foundProd?.name}- price is ${foundProd?.nonVariation?.sellingPrice} not ${product?.price}`;
            break;
          }
          if (
            foundProd?.isFlashDeal &&
            Number(foundProd?.nonVariation?.flashPrice) !== Number(product?.price)
          ) {
            errorMessage = `'${foundProd?.name}'- price is ${foundProd?.nonVariation?.sellingPrice} not ${product?.price}`;
            break;
          }
        } else {
          const foundVariant = foundProd?.variationData.find(
            (i) => String(i?._id) === String(product?.variationId)
          );

          // ... price ...
          if (
            !foundProd?.isFlashDeal &&
            Number(foundVariant?.sellingPrice) !== Number(product?.price)
          ) {
            errorMessage = `${foundProd?.name}(${product?.variationName}) - price is ${foundVariant?.sellingPrice} not ${product?.price}`;
            break;
          }
          if (
            foundProd?.isFlashDeal &&
            Number(foundVariant?.flashPrice) !== Number(product?.price)
          ) {
            errorMessage = `${foundProd?.name}(${product?.variationName})- price is ${foundVariant?.sellingPrice} not ${product?.price}`;
            break;
          }
        }

        totalWeight += Number(foundProd?.weight) * Number(product?.quantity);
        const productPrice = Number(product?.price) * Number(product?.quantity);
        sumOfTotalProductPrice += productPrice;

        let productObj = {
          ...product,
          variationId: product?.variationId === "" ? null : product?.variationId,
        };
        if (foundProd?.resellerDetails?.isCommissionOn) {
          const profit =
            (Number(productPrice) * Number(foundProd?.resellerDetails?.commission)) / 100;
          profitMoney += profit;
          productObj = {
            ...productObj,
            resellerInfo: {
              isResellerBaseCommission: false,
              commission: Number(foundProd?.resellerDetails?.commission),
              profitMoney: profit,
            },
          };
        } else {
          const profit = (Number(productPrice) * Number(resellerData.commission)) / 100;
          profitMoney += profit;
          productObj = {
            ...productObj,
            resellerInfo: {
              isResellerBaseCommission: false,
              commission: Number(resellerData.commission),
              profitMoney: profit,
            },
          };
        }
        allProducts.push(productObj);
      }

      const allComboProducts = [];
      // const allCombos = req.body.combos.map((combo) => {
      const allCombos = [];
      for (const combo of req.body.combos) {
        const ORDER_COMBO_ID = new mongoose.Types.ObjectId();

        const foundCombo = checkAllCombos.find(
          (item) => String(item?._id) === String(combo?.comboId)
        );

        if (!foundCombo) {
          errorMessage = "There is some invalid combo!";
          break;
        }

        if (foundCombo.sellingPrice !== combo.price) {
          errorMessage = `Incorrect combo price of ${foundCombo.name}!`;
          break;
        }

        for (const product of combo.products) {
          const foundProd = checkAllProducts.find(
            (i) => String(i?._id) === String(product?.productId)
          );

          // product check
          if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
            errorMessage = "There is some invalid products!";
            break;
          }

          if (product?.isVariant) {
            const foundVariant = foundProd?.variationData.find(
              (i) => String(i?._id) === String(product?.variationId)
            );
            // variant check
            if (!foundVariant) {
              errorMessage = "There is some invalid products!";
              break;
            }
          }

          totalWeight += Number(foundProd?.weight) * Number(combo?.quantity);

          allComboProducts.push({
            ...product,
            orderComboId: ORDER_COMBO_ID,
            orderId: MONGOOSE_ID,
            comboId: combo?.comboId,
            quantity: combo?.quantity,
            variationId: product?.variationId === "" ? null : product?.variationId,
          });
        }
        if (errorMessage !== "") {
          break;
        }

        const comboPrice = Number(foundCombo?.sellingPrice) * Number(combo?.quantity);
        sumOfTotalProductPrice += comboPrice;

        let comboObj = {
          _id: ORDER_COMBO_ID,
          orderId: MONGOOSE_ID,
          comboId: combo?.comboId,
          quantity: combo?.quantity,
          price: combo?.price,
        };

        if (foundCombo?.resellerDetails?.isCommissionOn) {
          const profit =
            (Number(comboPrice) * Number(foundCombo?.resellerDetails?.commission)) / 100;
          profitMoney += profit;
          comboObj = {
            ...comboObj,
            resellerInfo: {
              isResellerBaseCommission: false,
              commission: Number(foundCombo?.resellerDetails?.commission),
              profitMoney: profit,
            },
          };
        } else {
          const profit = (Number(comboPrice) * Number(resellerData.commission)) / 100;
          profitMoney += profit;
          comboObj = {
            ...comboObj,
            resellerInfo: {
              isResellerBaseCommission: false,
              commission: Number(resellerData.commission),
              profitMoney: profit,
            },
          };
        }

        allCombos.push(comboObj);
      }

      if (errorMessage !== "") {
        return res.status(409).json({
          data: null,
          success: false,
          message: errorMessage,
        });
      }

      if (Number(sumOfTotalProductPrice) !== Number(req.body.customerCharge.totalProductPrice)) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Wrong calculation in total product price!",
        });
      }

      if (req.body.promo !== "") {
        if (
          promoData?.userLimitInfo?.haveLimit &&
          promoData?.userLimitInfo?.maxUsed <= customerPromoUsed
        ) {
          return res.status(409).json({
            data: null,
            success: false,
            message: "The Promo code limit was exceeded for you!",
          });
        }

        const promoResponse = promoVerify(
          promoData,
          req.body.deliveryAddress.phone,
          req.body.products,
          req.body.combos,
          checkAllProducts
        );

        if (promoResponse?.promoType === "invalid") {
          return res.status(400).json({
            data: null,
            success: false,
            message: promoResponse?.errorMsg,
          });
        }
        if (promoResponse?.promoType === "free_delivery") {
          if (req.body.customerCharge.discountPrice !== 0) {
            return res.status(400).json({
              data: null,
              success: false,
              message: "Wrong discount amount, Discount must be zero!",
            });
          }
          if (req.body.customerCharge.deliveryCharge !== 0) {
            return res.status(400).json({
              data: null,
              success: false,
              message: "Wrong delivery charge, Charge must be zero!",
            });
          }
        } else if (promoResponse?.discount !== req.body.customerCharge.discountPrice) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Wrong discount amount!",
          });
        }
      } else if (req.body.promo === "" && req.body.customerCharge.discountPrice !== 0) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Wrong discount amount, There is no promo!",
        });
      }

      if (req.body.customerId === "") {
        if (checkCustomer) {
          checkCustomer.cityId = req.body.deliveryAddress?.cityId
            ? req.body.deliveryAddress?.cityId
            : null;
          checkCustomer.zoneId = req.body.deliveryAddress?.zoneId
            ? req.body.deliveryAddress?.zoneId
            : null;
          checkCustomer.areaId = req.body.deliveryAddress?.areaId
            ? req.body.deliveryAddress.areaId
            : null;
          await checkCustomer.save({ session });
          req.body.customerId = checkCustomer?._id;
        } else {
          const hashPassword = await bcrypt.hash("1234", 12);
          const [customerData] = await CustomerModel.create(
            [
              {
                ...req.body.deliveryAddress,
                userName: req.body.deliveryAddress.phone,
                password: hashPassword,
                resellerId: req.reseller._id,
              },
            ],
            { session }
          );
          req.body.customerId = customerData?._id;
        }
      }

      const serialId = await resellerOrderSerialNumber(totalOrder);
      const totalQty =
        req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0) +
        req.body.combos.reduce((prev, cur) => prev + Number(cur.quantity), 0);

      totalWeight /= 1000;
      if (totalWeight < 0.5) {
        totalWeight = 0.5;
      } else if (totalWeight > 10) {
        totalWeight = 10;
      }

      const resellerInfo = {
        resellerId: req.reseller._id,
        profitMoney,
        advanceMoney: 0,
        grandProfit: Number(profitMoney),
      };

      const customerCharge = getCustomerCharge({
        totalProductPrice: req.body?.customerCharge?.totalProductPrice,
        discountPrice: req.body?.customerCharge?.discountPrice,
        deliveryCharge: req.body?.customerCharge?.deliveryCharge,
        totalPayTk: 0,
      });

      let orderObj = {
        _id: MONGOOSE_ID,
        serialId,
        barCode: customBarCode(17),
        customerId: req.body.customerId,
        products: allProducts,
        customerNote: req.body.customerNote,
        resellerStatus: "pending",
        resellerStatusHistory: [
          {
            status: "pending",
            time: new Date().toISOString(),
          },
        ],
        totalQty,
        totalWeight,
        deliveryType: req.body.deliveryType,
        promoCode: req.body.promo.toLowerCase(),
        deliveryAddress: req.body.deliveryAddress,
        customerCharge,
        resellerInfo,
        createdBy: req.user.role,
        assignEmployeeId: null,
        duplicateNumber: totalDuplicate || 0,
      };

      // if (!req.body.onlinePaymentReq) {
      //   res.status(201).json({
      //     data: {
      //       _id: MONGOOSE_ID,
      //       serialId,
      //       deliveryAddress: req.body.deliveryAddress,
      //       customerCharge,
      //     },
      //     success: true,
      //     message: "Create order successfully.",
      //   });
      // }

      const payObj = {
        serialId: orderObj.serialId,
        customerCharge: orderObj.customerCharge.totalBill,
        userName: req.body.deliveryAddress.name,
        phone: req.body.deliveryAddress.phone,
        host: req.body.host,
        origin: "affiliate",
      };

      // PAYMENT GATEWAY : INITIATE PAYMENT REQUEST
      let pgwResponse;
      if (req.body.onlinePaymentReq) {
        pgwResponse = await initPayment(payObj);
        if (pgwResponse.success) {
          orderObj = {
            ...orderObj,
            onlinePayment: { req: req.body.onlinePaymentReq, url: pgwResponse.url },
          };
        } else {
          orderObj = {
            ...orderObj,
            onlinePayment: { req: req.body.onlinePaymentReq, error: pgwResponse.message },
          };
        }
      }

      const promiseArr = [
        OrderModel.insertMany([orderObj], { session }),
        ResellerOrderProductModel.insertMany(
          allProducts.map((i) => ({
            ...i,
            orderId: MONGOOSE_ID,
          })),
          { session }
        ),
        LogModel.insertMany(
          [
            {
              referObjectId: MONGOOSE_ID,
              message: `${req.user.role} create this order.`,
              time: new Date().toISOString(),
            },
          ],
          { session }
        ),
        OrderComboModel.insertMany(allCombos, { session }),
        OrderComboProductModel.insertMany(allComboProducts.flat(), { session }),
      ];

      if (promoData && promoData?.limitInfo?.haveLimit) {
        promiseArr.push(
          PromoModel.findOneAndUpdate(
            {
              promo:
                req.body.promo === "" ? null : { $regex: `^${req.body.promo}$`, $options: "i" },
            },
            {
              $inc: {
                "limitInfo.totalUsed": 1,
              },
            },
            { new: true, session }
          )
        );
      }

      const [orderData] = await Promise.all(promiseArr);

      if (!orderData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Failed to create order!",
        });
      }

      if (!req.body.onlinePaymentReq) {
        res.status(201).json({
          data: {
            _id: MONGOOSE_ID,
            serialId,
            deliveryAddress: req.body.deliveryAddress,
            customerCharge,
          },
          success: true,
          message: "Create order successfully.",
        });
      }

      if (req.body.onlinePaymentReq) {
        res.status(201).json({
          data: orderObj,
          success: true,
          paymentUrl: pgwResponse?.url || "",
          message: "Create order successfully.",
        });
      }

      await session.commitTransaction();

      const message = pendingOrderMsg(orderObj?.serialId, orderObj?.customerCharge?.remainingTkPay);
      if (message !== "") {
        await smsSend(orderObj?.deliveryAddress?.phone, message);
      }

      return {};
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("*** orderController: createCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// FETCH ALL CUSTOMER ORDERS
const fetchAllCustomerOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [orderData, totalData] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            customerId: ObjectId(req.user._id),
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerOrderPopulate,
        {
          $project: orderProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments({
        customerId: ObjectId(req.user._id),
        resellerId: null,
      }),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchAllCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchSingleOrder = async (req, res) => {
  try {
    const [orderData] = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
        },
      },
      ...resellerOrderPopulate,
      {
        $project: orderProjection,
      },
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    return res.status(200).json({
      data: orderData,
      message: "Fetch single order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH VISITOR ORDERS
const fetchVisitorOrders = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;
    const matchCondition = [
      {
        "resellerInfo.resellerId": ObjectId(req.reseller._id),
      },
      {
        $or: [
          {
            "deliveryAddress.phone": req.params.value,
          },
          {
            serialId: req.params.value,
          },
        ],
      },
    ];

    const [orderData, totalData] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        {
          $project: {
            serialId: 1,
            orderStatus: 1,
            deliveryAddress: 1,
            customerCharge: 1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments({ $and: matchCondition }),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch single order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** adminCustomerOrderController: fetchVisitorOrders ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // ADMIN
  createCustomerOrder,
  fetchAllCustomerOrder,
  fetchSingleOrder,
  fetchVisitorOrders,
};
