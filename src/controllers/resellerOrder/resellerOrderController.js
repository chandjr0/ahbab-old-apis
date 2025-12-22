const bcrypt = require("bcryptjs");

const { nanoid } = require("nanoid");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const { customAlphabet } = require("nanoid");

const customBarCode = customAlphabet("0123456789", 17);

const ComboModel = require("../../models/comboProduct/combo");
const ResellerModel = require("../../models/user/reseller");
const OrderModel = require("../../models/resellerOrder/resellerOrder");
const OrderComboModel = require("../../models/resellerOrder/resellerOrderCombo");
const OrderComboProductModel = require("../../models/resellerOrder/resellerOrderComboProduct");
const ResellerOrderProductModel = require("../../models/resellerOrder/resellerOrderProducts");
const LogModel = require("../../models/helpers/log");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
const CustomerModel = require("../../models/user/customer");
const customMetaData = require("../../helpers/customMetaData");
const { resellerOrderSerialNumber, getCustomerCharge } = require("../../helpers/shareFunc");
const { resellerOrderPopulate } = require("../../helpers/allOrderQuery");
const PathaoCityModel = require("../../models/courierServices/pathao/pathaoCity");
const PathaoZoneModel = require("../../models/courierServices/pathao/pathaoZone");
// const uploadImage = require("../../utils/upload-img");
// const { confirmOrderMsg } = require("../../service/smsList");
// const smsSend = require("../../service/smsService");

const orderProjection = {
  serialId: 1,
  customerId: 1,
  products: 1,
  combos: 1,
  orderStatus: 1,
  resellerStatus: 1,
  orderPayStatus: 1,
  resellerNote: 1,
  customerNote: 1,
  payment: 1,
  deliveryAddress: 1,
  customerCharge: 1,
  deliverySiteCost: 1,
  adminRevenue: 1,
  createdBy: 1,
  totalQty: 1,
  createdAt: 1,
  isReturn: 1,
  isRefund: 1,
  updateHistory: 1,
  courierData: 1,
  courierInfo: 1,
  resellerInfo: 1,
  duplicateNumber: 1,
  promoCode: 1,
};

// CREATE POS ORDER
const createPosOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const MONGOOSE_ID = new mongoose.Types.ObjectId();
      if (req.body.customerId) {
        const isExistCustomer = await CustomerModel.findOne({
          _id: req.body.customerId,
          resellerId: req.user._id,
        });
        if (!isExistCustomer) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Customer not found!",
          });
        }
      }

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
      ] = await Promise.all([
        ResellerModel.findOne(
          {
            _id: req.user._id,
          },
          {
            commission: 1,
            status: 1,
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
        PathaoCityModel.findOne({ _id: ObjectId(req.body.deliveryAddress.cityId) }),
        PathaoZoneModel.findOne({ _id: ObjectId(req.body.deliveryAddress.zoneId) }),
        CustomerModel.findOne({
          userName: req.body.deliveryAddress.phone,
          resellerId: req.user._id,
        }),
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({
          "deliveryAddress.phone": req.body.deliveryAddress.phone,
          createdAt: { $gte: startTime },
        }),
      ]);

      if (!resellerData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not found!",
        });
      }

      if (resellerData?.status !== "active") {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not active!",
        });
      }

      if (!cityData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid city data!",
        });
      }

      if (!zoneData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid zone data!",
        });
      }

      let totalWeight = 0;
      let sumOfTotalProductPrice = 0;
      const productBulkData = [];
      const variantBulkData = [];
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
          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: {
                _id: ObjectId(product?.productId),
                "nonVariation.stock": { $gte: Number(product?.quantity) },
                // totalStock: { $gte: Number(product?.quantity) },
              },
              update: {
                $inc: {
                  "nonVariation.stock": -Number(product?.quantity),
                  totalStock: -Number(product?.quantity),
                  totalSell: Number(product?.quantity),
                },
                $set: {
                  isUsed: true,
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundProd?.nonVariation?.stock) < Number(product?.quantity)) {
            errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${product?.quantity} Qty.`;
            break;
          }

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
          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: {
                _id: ObjectId(product?.productId),
                // totalStock: { $gte: Number(product?.quantity) },
              },
              update: {
                $inc: {
                  totalStock: -Number(product?.quantity),
                  totalSell: Number(product?.quantity),
                },
                $set: {
                  isUsed: true,
                },
              },
            },
          });

          variantBulkData.push({
            updateOne: {
              filter: {
                _id: ObjectId(product?.variationId),
                stock: { $gte: Number(product?.quantity) },
              },
              update: {
                $inc: {
                  stock: -Number(product?.quantity),
                },
                $set: {
                  isUsed: true,
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundVariant?.stock) < Number(product?.quantity)) {
            errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You Select ${product?.quantity} Qty.`;
            break;
          }

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
      const comboBulkData = [];
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

        comboBulkData.push({
          updateOne: {
            filter: { _id: ObjectId(combo?.comboId) },
            update: {
              $inc: {
                totalSell: Number(combo?.quantity),
              },
            },
          },
        });

        for (const product of combo.products) {
          const foundProd = checkAllProducts.find(
            (i) => String(i?._id) === String(product?.productId)
          );

          // product check
          if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
            errorMessage = "There is some invalid products!";
            break;
          }

          if (!product?.isVariant) {
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.productId),
                  "nonVariation.stock": { $gte: Number(combo?.quantity) },
                  totalStock: { $gte: Number(combo?.quantity) },
                },
                update: {
                  $inc: {
                    "nonVariation.stock": -Number(combo?.quantity),
                    totalStock: -Number(combo?.quantity),
                    totalSell: Number(combo?.quantity),
                    comboSell: Number(combo?.quantity),
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });

            // .... stock ...
            if (Number(foundProd?.nonVariation?.stock) < Number(combo?.quantity)) {
              errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${combo?.quantity} Qty.`;
              break;
            }
          } else {
            const foundVariant = foundProd?.variationData.find(
              (i) => String(i?._id) === String(product?.variationId)
            );
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.productId),
                  totalStock: { $gte: Number(combo?.quantity) },
                },
                update: {
                  $inc: {
                    totalStock: -Number(combo?.quantity),
                    totalSell: Number(combo?.quantity),
                    comboSell: Number(combo?.quantity),
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.variationId),
                  stock: { $gte: Number(combo?.quantity) },
                },
                update: {
                  $inc: {
                    stock: -Number(combo?.quantity),
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });

            // .... stock ...
            if (Number(foundVariant?.stock) < Number(combo?.quantity)) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You Select ${combo?.quantity} Qty.`;
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

      if (req.body.customerId === "") {
        if (checkCustomer) {
          checkCustomer.cityId = req.body.deliveryAddress.cityId;
          checkCustomer.zoneId = req.body.deliveryAddress.zoneId;
          checkCustomer.areaId = req.body.deliveryAddress?.areaId
            ? req.body.deliveryAddress.areaId
            : null;
          await checkCustomer.save();
          req.body.customerId = checkCustomer?._id;
        } else {
          const hashPassword = await bcrypt.hash("1234", 12);
          const [customerData] = await CustomerModel.create(
            [
              {
                ...req.body.deliveryAddress,
                userName: req.body.deliveryAddress.phone,
                password: hashPassword,
                resellerId: req.user._id,
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
        resellerId: req.user._id,
        profitMoney,
        advanceMoney: 0,
        grandProfit: Number(profitMoney),
      };

      const customerCharge = getCustomerCharge({
        totalProductPrice: req.body?.customerCharge?.totalProductPrice,
        discountPrice: 0,
        deliveryCharge: req.body?.customerCharge?.deliveryCharge,
        totalPayTk: 0,
      });

      const orderObj = {
        _id: MONGOOSE_ID,
        serialId,
        barCode: customBarCode(17),
        customerId: req.body.customerId,
        products: allProducts,
        resellerNote: [
          {
            message: req.body.resellerNoteMessage,
            time: new Date().toISOString(),
          },
        ],
        customerNote: req.body.customerNote,
        resellerStatus: "confirm",
        resellerStatusHistory: [
          {
            status: "confirm",
            time: new Date().toISOString(),
          },
        ],
        orderStatus: [
          {
            status: "PENDING",
            time: new Date().toISOString(),
            changeBy: "reseller",
            employeeId: null,
          },
        ],
        totalQty,
        totalWeight,
        deliveryType: req.body.deliveryType,
        deliveryAddress: req.body.deliveryAddress,
        customerCharge,
        resellerInfo,
        createdBy: "reseller",
        assignEmployeeId: null,
        duplicateNumber: totalDuplicate || 0,
      };

      if (req.body.resellerNoteMessage === "") {
        delete orderObj.resellerNote;
      }

      const [orderData, productData, variantData] = await Promise.all([
        OrderModel.insertMany([orderObj], { session }),
        ProductModel.bulkWrite(productBulkData, { session }),
        VariationModel.bulkWrite(variantBulkData, { session }),
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
              message: `reseller create this order.`,
              time: new Date().toISOString(),
            },
          ],
          { session }
        ),
        OrderComboModel.insertMany(allCombos, { session }),
        OrderComboProductModel.insertMany(allComboProducts, { session }),
        ComboModel.bulkWrite(comboBulkData, { session }),
      ]);

      if (!orderData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Failed to create order!",
        });
      }

      if (
        (productData.nModified || 0) !== productBulkData.length ||
        (variantData.nModified || 0) !== variantBulkData.length
      ) {
        throw new Error("There is some stock issue!");
      }

      await session.commitTransaction();

      // const message = confirmOrderMsg(orderObj?.serialId, orderObj?.customerCharge?.remainingTkPay);
      // if (message !== "") {
      //   await smsSend(orderObj?.deliveryAddress?.phone, message);
      // }

      return res.status(201).json({
        data: orderObj,
        success: true,
        message: "Create order successfully.",
      });
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("*** resellerOrderController: createPosOrder ***");
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

// FETCH ORDER FOR UPDATE
const fetchOrderForUpdate = async (req, res) => {
  try {
    const [singleOrderData] = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
        },
      },
      ...resellerOrderPopulate,
    ]);

    if (!singleOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch order data!",
      });
    }

    const orderData = JSON.parse(JSON.stringify(singleOrderData));

    // return res.json({ orderData });

    // console.log("status: ", orderData?.orderStatus.length);
    // check order status meet with - delivery, cancel, return, refund
    let isCancel = true;
    orderData?.orderStatus.forEach((st) => {
      if (["PENDING", "CONFIRM"].includes(st?.status)) {
        isCancel = false;
      }
    });
    if (isCancel && orderData?.orderStatus.length > 0) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "This order couldn't be update!",
      });
    }

    const allProducts = [];
    await Promise.all(
      orderData?.products.map(async (prod) => {
        // let prodStock = 0;
        // prodStock = prod?.product?.nonVariation?.stock;
        // if (prod?.isVariant) {
        //   const variationData = await VariationModel.findOne({ _id: prod?.variationId });
        //   prodStock = variationData?.variation?.stock;
        // }

        // console.log("prod?.variationId : ", prod);

        const obj = {
          uid: nanoid(),
          productId: prod?.product?._id,
          slug: prod?.product?.slug,
          name: prod?.product?.name,
          isVariant: prod?.isVariant,
          variantId: prod?.isVariant ? prod?.variation?._id : "",
          variantName: prod?.variationName,
          quantity: prod?.quantity,
          price: prod?.price,
          subTotal: Number(prod?.quantity) * Number(prod?.price),
          images: !prod?.isVariant ? prod?.product?.galleryImage : prod?.variation?.images,
          sku: prod?.sku,
          stock: !prod?.isVariant ? prod?.product?.nonVariation?.stock : prod?.variation?.stock,
          isOld: true,
        };

        allProducts.push(obj);
      })
    );

    const allCombos = orderData?.combos.map((item) => ({
      ...item,
      _id: item?.comboId,
      uid: nanoid(),
    }));

    orderData.products = allProducts;
    orderData.combos = allCombos;

    return res.status(200).json({
      data: orderData,
      message: "Fetch single order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// Update ORDER
const UpdateOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const selectedProductIds = req.body.products.map((i) => ObjectId(i?.productId));
      const selectedComboProductIds = req.body.combos
        .map((item) => item?.products.map((prod) => ObjectId(prod?.productId)))
        .flat();

      const [[checkOrder], resellerData, checkAllProducts, checkAllCombos, cityData, zoneData] =
        await Promise.all([
          OrderModel.aggregate([
            {
              $match: {
                serialId: { $eq: req.params.serialId },
              },
            },
            {
              $lookup: {
                from: "reseller_order_products",
                let: { pId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$orderId", "$$pId"] } } }],
                as: "products",
              },
            },
            {
              $lookup: {
                from: "reseller_order_combos",
                localField: "_id",
                foreignField: "orderId",
                pipeline: [
                  {
                    $lookup: {
                      from: "reseller_order_combo_products",
                      localField: "orderId",
                      foreignField: "orderId",
                      pipeline: [],
                      as: "products",
                    },
                  },
                ],
                as: "combos",
              },
            },
            {
              $project: {
                _id: 1,
                serialId: 1,
                products: 1,
                combos: 1,
                resellerNote: 1,
                orderStatus: 1,
                customerCharge: 1,
              },
            },
          ]),
          ResellerModel.findOne(
            {
              _id: req.user._id,
            },
            {
              commission: 1,
              status: 1,
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
              isReseller: true,
            },
            {
              name: 1,
              sellingPrice: 1,
              products: 1,
              isReseller: 1,
              resellerDetails: 1,
            }
          ),
          PathaoCityModel.findOne({ _id: ObjectId(req.body.deliveryAddress.cityId) }),
          PathaoZoneModel.findOne({ _id: ObjectId(req.body.deliveryAddress.zoneId) }),
        ]);

      if (!resellerData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not found!",
        });
      }

      if (resellerData?.status !== "active") {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not active!",
        });
      }

      if (!checkOrder) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid order data!",
        });
      }
      let isCancel = true;
      checkOrder?.orderStatus.forEach((st) => {
        if (["", "PENDING", "CONFIRM"].includes(st?.status)) {
          isCancel = false;
        }
      });
      if (isCancel && checkOrder?.orderStatus.length > 0) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "This order couldn't be update!",
        });
      }

      if (!checkAllProducts) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "There is some invalid products!",
        });
      }

      if (!resellerData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid reseller data!",
        });
      }

      if (!cityData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid city data!",
        });
      }

      if (!zoneData) {
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

        const prevProd = checkOrder?.products.find(
          (i) =>
            String(i?.productId) === String(product?.productId) &&
            Boolean(i?.isVariant) === Boolean(product?.isVariant)
        );

        let upStock = 0;
        if (prevProd) {
          upStock = Number(product?.quantity) - Number(prevProd?.quantity);
        } else {
          upStock = Number(product?.quantity);
        }

        // product check
        if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
          errorMessage = "There is some invalid products!";
          break;
        }

        if (!product?.isVariant) {
          // .... stock ...
          if (Number(foundProd?.nonVariation?.stock) < Number(upStock)) {
            errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${upStock} Qty.`;
            break;
          }

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

          // .... stock ...
          if (Number(foundVariant?.stock) < Number(upStock)) {
            errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You Select ${upStock} Qty.`;
            break;
          }

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

        const prevCombo = checkOrder?.combos.find(
          (i) => String(i?.comboId) === String(combo?.comboId)
        );

        for (const product of combo.products) {
          const foundProd = checkAllProducts.find(
            (i) => String(i?._id) === String(product?.productId)
          );

          // product check
          if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
            errorMessage = "There is some invalid products!";
            break;
          }

          let upStock = 0;
          if (prevCombo) {
            upStock = Number(combo?.quantity) - Number(prevCombo?.quantity);
          } else {
            upStock = Number(combo?.quantity);
          }

          if (!product?.isVariant) {
            // .... stock ...
            if (Number(foundProd?.nonVariation?.stock) < Number(upStock)) {
              errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${upStock} Qty.`;
              break;
            }
          } else {
            const foundVariant = foundProd?.variationData.find(
              (i) => String(i?._id) === String(product?.variationId)
            );

            // .... stock ...
            if (Number(foundVariant?.stock) < Number(upStock)) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You Select ${upStock} Qty.`;
              break;
            }
          }

          totalWeight += Number(foundProd?.weight) * Number(combo?.quantity);
          allComboProducts.push({
            ...product,
            orderComboId: ORDER_COMBO_ID,
            orderId: checkOrder?._id,
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
          orderId: checkOrder?._id,
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

      const totalQty =
        req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0) +
        req.body.combos.reduce((prev, cur) => prev + Number(cur.quantity), 0);

      totalWeight /= 1000;
      if (totalWeight < 0.5) {
        totalWeight = 0.5;
      } else if (totalWeight > 10) {
        totalWeight = 10;
      }

      let resellerNote = JSON.parse(JSON.stringify(checkOrder?.resellerNote)) || [];
      if (req.body.resellerNoteMessage) {
        resellerNote = [
          ...resellerNote,
          {
            message: req.body.resellerNoteMessage,
            createdBy: req.user?.role ? "admin" : req?.user?.name,
            time: new Date().toISOString(),
          },
        ];
      }

      const resellerInfo = {
        resellerId: req.user._id,
        profitMoney,
        advanceMoney: 0,
        grandProfit: Number(profitMoney),
      };

      const customerCharge = getCustomerCharge({
        totalProductPrice: req.body?.customerCharge?.totalProductPrice,
        discountPrice: checkOrder?.customerCharge?.discountPrice,
        deliveryCharge: req.body?.customerCharge?.deliveryCharge,
        totalPayTk: checkOrder?.customerCharge?.totalPayTk,
      });

      const orderObj = {
        customerId: req.body.customerId,
        resellerNote,
        customerNote: req.body.customerNote,
        totalQty,
        totalWeight,
        deliveryType: req.body.deliveryType,
        deliveryAddress: req.body.deliveryAddress,
        customerCharge,
        resellerInfo,
      };

      const resellerOrderProductIds = checkOrder?.products.map((i) => i?._id);

      const [orderData] = await Promise.all([
        OrderModel.findOneAndUpdate(
          { serialId: req.params.serialId },
          {
            $set: orderObj,
          },
          {
            new: true,
            session,
          }
        ),
        ResellerOrderProductModel.insertMany(
          allProducts.map((i) => ({
            ...i,
            orderId: checkOrder?._id,
          })),
          { session }
        ),
        ResellerOrderProductModel.deleteMany(
          {
            _id: { $in: resellerOrderProductIds },
          },
          { session }
        ),
        LogModel.insertMany(
          [
            {
              referObjectId: checkOrder?._id,
              message: `${
                req.user.role === "reseller" ? "reseller" : `${req.user.name}(${req.user.phone})`
              } update this order.`,
              time: new Date().toISOString(),
            },
          ],
          { session }
        ),
        OrderComboModel.insertMany(allCombos, { session }),
        OrderComboProductModel.insertMany(allComboProducts, { session }),
        OrderComboModel.deleteMany(
          {
            _id: { $in: checkOrder.combos.map((item) => ObjectId(item._id)) },
          },
          { session }
        ),
        OrderComboProductModel.deleteMany(
          {
            _id: {
              $in: checkOrder.combos
                .map((item) => item.products.map((i) => ObjectId(i?._id)))
                .flat(),
            },
          },
          { session }
        ),
      ]);

      if (!orderData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Failed to create order!",
        });
      }

      await session.commitTransaction();
      return res.status(201).json({
        data: orderObj,
        success: true,
        message: "Update order successfully.",
      });
    });
  } catch (err) {
    console.log("*** adminOrderController: UpdateOrder ***");
    console.log("ERROR:", err);
    await session.abortTransaction();
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// FETCH CUSTOMER ALL ORDERS
const fetchCustomerAllOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [orderData, totalData] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            customerId: ObjectId(req.params.customerId),
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
        customerId: ObjectId(req.params.customerId),
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

// FETCH ALL ORDERS
const fetchAllPendingOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.user._id)],
      },
    ];

    if (req.body.resellerStatus !== "all") {
      matchCondition.push({
        $eq: ["$resellerStatus", req.body.resellerStatus],
      });
    } else {
      matchCondition.push({
        $ne: ["$resellerStatus", "confirm"],
      });
    }

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$createdAt", req.body.endTime],
      });
    }

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
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
        $expr: {
          $and: matchCondition,
        },
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
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: fetchAllOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH ORDERS BY ADMIN
const searchPendingOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $and: [
        {
          "resellerInfo.resellerId": ObjectId(req.user._id),
        },
        {
          resellerStatus: { $ne: "confirm" },
        },
        {
          $or: [
            { "deliveryAddress.phone": { $regex: req.body.value, $options: "i" } },
            { serialId: { $regex: req.body.value, $options: "i" } },
          ],
        },
      ],
    };

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: matchCondition,
        },
        ...resellerOrderPopulate,
        {
          $project: orderProjection,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments(matchCondition),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: searchOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL ORDERS
const fetchAllOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.user._id)],
      },
    ];

    // "resellerInfo.resellerId": ObjectId(req.user._id),
    // resellerStatus: "confirm",
    const countMatchCondition = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.user._id)],
      },
    ];

    if (req.body.status !== "ALL") {
      matchCondition.push({
        $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, req.body.status],
      });
    }

    if (req.body.resellerStatus !== "all") {
      matchCondition.push({
        $eq: ["$resellerStatus", "confirm"],
      });
    }

    if (req.body.createdBy !== "ALL") {
      matchCondition.push({
        $eq: ["$createdBy", req.body.createdBy],
      });
    }

    if (req.body.courier !== "") {
      matchCondition.push({
        $eq: ["$courierId", ObjectId(req.body.courier)],
      });
    }

    // if (req.body.employee !== "") {
    //   matchCondition.push({
    //     $eq: ["$employeeId", ObjectId(req.body.employee)],
    //   });
    // }

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$createdAt", req.body.endTime],
      });

      countMatchCondition.push({
        $gte: ["$createdAt", req.body.startTime],
      });
      countMatchCondition.push({
        $lte: ["$createdAt", req.body.endTime],
      });
    }

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
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
        $expr: {
          $and: matchCondition,
        },
      }),
      OrderModel.aggregate([
        // {
        //   $match: {
        //     "resellerInfo.resellerId": ObjectId(req.user._id),
        //     resellerStatus: "confirm",
        //   },
        // },
        {
          $match:
            countMatchCondition.length > 0
              ? {
                  $expr: {
                    $and: countMatchCondition,
                  },
                }
              : {},
        },
        {
          $addFields: {
            statusName: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: "$statusName",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: fetchAllOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH ORDERS BY ADMIN
const searchOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $and: [
        {
          "resellerInfo.resellerId": ObjectId(req.user._id),
        },
        {
          resellerStatus: "confirm",
        },
        {
          $or: [
            { "deliveryAddress.name": { $regex: req.body.value, $options: "i" } },
            { "deliveryAddress.address": { $regex: req.body.value, $options: "i" } },
            { "deliveryAddress.phone": { $regex: req.body.value, $options: "i" } },
            { serialId: { $regex: req.body.value, $options: "i" } },
          ],
        },
      ],
    };

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: matchCondition,
        },
        ...resellerOrderPopulate,
        {
          $project: orderProjection,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments(matchCondition),
      OrderModel.aggregate([
        {
          $match: {
            "resellerInfo.resellerId": ObjectId(req.user._id),
          },
        },
        {
          $addFields: {
            statusName: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: "$statusName",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: searchOrder ***");
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
          "resellerInfo.resellerId": ObjectId(req.user._id),
        },
      },
      ...resellerOrderPopulate,
      {
        $project: {
          ...orderProjection,
          refundMoney: 1,
          returnMoney: 1,
        },
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
    console.log("*** resellerOrderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchMultipleOrder = async (req, res) => {
  try {
    const orderData = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $in: req.body.serialIds },
          "resellerInfo.resellerId": ObjectId(req.user._id),
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
      message: "Fetch multiple order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerOrderController: fetchMultipleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ----------------- update action -----------------
// UPDATE ORDER STATUS BY RESELLER
const updateOrderStatusByReseller = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const [[checkOrderData], resellerData] = await Promise.all([
        OrderModel.aggregate([
          {
            $match: {
              _id: ObjectId(req.params.orderId),
            },
          },
          {
            $lookup: {
              from: "reseller_order_products",
              let: { pId: "$_id" },
              pipeline: [{ $match: { $expr: { $eq: ["$orderId", "$$pId"] } } }],
              as: "products",
            },
          },
          {
            $lookup: {
              from: "reseller_order_combos",
              localField: "_id",
              foreignField: "orderId",
              pipeline: [
                {
                  $lookup: {
                    from: "reseller_order_combo_products",
                    localField: "orderId",
                    foreignField: "orderId",
                    pipeline: [],
                    as: "products",
                  },
                },
              ],
              as: "combos",
            },
          },
          {
            $project: {
              _id: 1,
              serialId: 1,
              products: 1,
              combos: 1,
              resellerNote: 1,
              orderStatus: 1,
              customerCharge: 1,
              deliveryAddress: 1,
            },
          },
        ]),
        ResellerModel.findOne(
          {
            _id: req.user._id,
          },
          {
            commission: 1,
            status: 1,
          }
        ),
      ]);

      if (!resellerData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not found!",
        });
      }

      if (resellerData?.status !== "active") {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Reseller not active!",
        });
      }

      if (!checkOrderData) {
        return res.status(400).json({
          data: null,
          success: true,
          message: "Order not found!",
        });
      }

      const prevStatus = checkOrderData?.resellerStatus;
      if (["confirm", "cancel"].includes(prevStatus)) {
        return res.status(409).json({
          data: null,
          success: true,
          message: `Couldn't '${req.body.status.toLowerCase()}' the order. This order is already in ${prevStatus}`,
        });
      }

      if (req.body.status === "confirm") {
        if (!checkOrderData?.deliveryAddress?.cityId || !checkOrderData?.deliveryAddress?.zoneId) {
          return res.status(400).json({
            data: null,
            success: true,
            message: "Please update the customer address.",
          });
        }

        const selectedProductIds = checkOrderData.products.map((i) => ObjectId(i?.productId));
        const selectedComboProductIds = checkOrderData.combos
          .map((item) => item?.products.map((prod) => ObjectId(prod?.productId)))
          .flat();

        const checkAllProducts = await ProductModel.aggregate([
          {
            $match: {
              _id: { $in: [...selectedProductIds, ...selectedComboProductIds] },
              isDeleted: false,
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
              isFlashDeal: 1,
              isVariant: 1,
              nonVariation: 1,
              variationData: 1,
            },
          },
        ]);

        const productBulkData = [];
        const variantBulkData = [];
        const comboBulkData = [];
        let errorMessage = "";
        checkOrderData?.products.forEach((product) => {
          const foundProd = checkAllProducts.find(
            (i) => String(i?._id) === String(product?.productId)
          );

          // product check
          if ((!foundProd || foundProd?.isVariant !== product?.isVariant) && errorMessage !== "") {
            errorMessage = "There is some invalid products!";
          }

          if (!product?.isVariant) {
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.productId),
                  "nonVariation.stock": { $gte: Number(product?.quantity) },
                  // totalStock: { $gte: Number(product?.quantity) },
                },
                update: {
                  $inc: {
                    "nonVariation.stock": -1 * Number(product?.quantity),
                    totalStock: -1 * Number(product?.quantity),
                    totalSell: Number(product?.quantity),
                  },
                },
              },
            });

            // .... stock ...
            if (
              Number(foundProd?.nonVariation?.stock) < Number(product?.quantity) &&
              errorMessage !== ""
            ) {
              errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. But Selected ${product?.quantity} Qty.`;
            }
          } else {
            const foundVariant = foundProd?.variationData.find(
              (i) => String(i?._id) === String(product?.variationId)
            );
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.productId),
                  // totalStock: { $gte: Number(product?.quantity) },
                },
                update: {
                  $inc: {
                    totalStock: -1 * Number(product?.quantity),
                    totalSell: Number(product?.quantity),
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: {
                  _id: ObjectId(product?.variationId),
                  stock: { $gte: Number(product?.quantity) },
                },
                update: {
                  $inc: {
                    stock: -1 * Number(product?.quantity),
                  },
                },
              },
            });

            // .... stock ...
            if (Number(foundVariant?.stock) < Number(product?.quantity) && errorMessage !== "") {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. ButSelected ${product?.quantity} Qty.`;
            }
          }
        });

        checkOrderData.combos.forEach((combo) => {
          comboBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(combo?.comboId) },
              update: {
                $inc: {
                  totalSell: Number(combo?.quantity),
                },
              },
            },
          });

          combo?.products.forEach((product) => {
            const foundProd = checkAllProducts.find(
              (i) => String(i?._id) === String(product?.productId)
            );

            // product check
            if (
              (!foundProd || foundProd?.isVariant !== product?.isVariant) &&
              errorMessage !== ""
            ) {
              errorMessage = "There is some invalid products!";
            }

            if (!product?.isVariant) {
              // .... bulk ...
              productBulkData.push({
                updateOne: {
                  filter: {
                    _id: ObjectId(product?.productId),
                    "nonVariation.stock": { $gte: Number(combo?.quantity) },
                    // totalStock: { $gte: Number(combo?.quantity) },
                  },
                  update: {
                    $inc: {
                      "nonVariation.stock": -1 * Number(combo?.quantity),
                      totalStock: -1 * Number(combo?.quantity),
                      totalSell: Number(combo?.quantity),
                      comboSell: Number(combo?.quantity),
                    },
                  },
                },
              });

              // .... stock ...
              if (
                Number(foundProd?.nonVariation?.stock) < Number(combo?.quantity) &&
                errorMessage !== ""
              ) {
                errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. But Selected ${combo?.quantity} Qty.`;
              }
            } else {
              const foundVariant = foundProd?.variationData.find(
                (i) => String(i?._id) === String(product?.variationId)
              );
              // .... bulk ...
              productBulkData.push({
                updateOne: {
                  filter: {
                    _id: ObjectId(product?.productId),
                    totalStock: { $gte: Number(combo?.quantity) },
                  },
                  update: {
                    $inc: {
                      totalStock: -1 * Number(combo?.quantity),
                      totalSell: Number(combo?.quantity),
                      comboSell: Number(combo?.quantity),
                    },
                  },
                },
              });

              variantBulkData.push({
                updateOne: {
                  filter: {
                    _id: ObjectId(product?.variationId),
                    stock: { $gte: Number(combo?.quantity) },
                  },
                  update: {
                    $inc: {
                      stock: -1 * Number(combo?.quantity),
                    },
                  },
                },
              });

              // .... stock ...
              if (Number(foundVariant?.stock) < Number(combo?.quantity) && errorMessage !== "") {
                errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. ButSelected ${combo?.quantity} Qty.`;
              }
            }
          });
        });

        if (errorMessage !== "") {
          return res.status(409).json({
            data: null,
            success: false,
            message: errorMessage,
          });
        }

        await Promise.all([
          ProductModel.bulkWrite(productBulkData, { session }),
          VariationModel.bulkWrite(variantBulkData, { session }),
          ComboModel.bulkWrite(comboBulkData, { session }),
        ]);
      }

      let setOrderObj = {
        resellerStatus: req.body.status,
      };

      if (req.body.status === "confirm") {
        setOrderObj = {
          ...setOrderObj,
          orderStatus: [
            {
              status: "PENDING",
              time: new Date().toISOString(),
              changeBy: "reseller",
              employeeId: null,
            },
          ],
        };
      }

      const [orderData] = await Promise.all([
        OrderModel.findOneAndUpdate(
          { _id: req.params.orderId },
          {
            $set: setOrderObj,
            $push: {
              resellerStatusHistory: {
                status: req.body.status,
                time: new Date().toISOString(),
              },
            },
          },
          {
            new: true,
            session,
          }
        ),
        LogModel.insertMany(
          [
            {
              referObjectId: checkOrderData?._id,
              message: `reseller update order status to ${req.body.status.toLowerCase()}`,
              time: new Date().toISOString(),
            },
          ],
          { session }
        ),
      ]);

      if (!orderData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: `Failed to ${req.body.status} order!`,
        });
      }

      await session.commitTransaction();
      return res.status(200).json({
        data: orderData,
        success: true,
        message: `'${req.body.status}' the order successfully.`,
      });
    });
  } catch (err) {
    console.log("*** adminOrderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    await session.abortTransaction();
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// UPDATE ORDER's CUSTOMER ADDRESS
const updateOrderCustomerAddress = async (req, res) => {
  try {
    const [updateOrderData] = await Promise.all([
      OrderModel.findOneAndUpdate(
        {
          _id: req.params.orderId,
        },
        {
          $set: {
            "deliveryAddress.districtId": req.body.districtId,
            "deliveryAddress.areaId": req.body.areaId,
            "deliveryAddress.address": req.body.address,
          },
        },
        {
          new: true,
        }
      ),
      LogModel.create({
        referObjectId: req.params.orderId,
        message: `reseller update customer address.`,
        time: new Date().toISOString(),
      }),
    ]);

    if (!updateOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update order address!`,
      });
    }

    return res.status(200).json({
      data: updateOrderData,
      success: true,
      message: "Order address updated successfully.",
    });
  } catch (err) {
    console.log("*** resellerOrderController: updateOrderCustomerAddress ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD ORDER NOTE
const addResellerNote = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $push: {
          resellerNote: {
            $each: [
              {
                message: req.body.note,
                time: new Date().toISOString(),
              },
            ],
            $position: 0,
          },
        },
      },
      {
        new: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to add note!`,
      });
    }

    return res.status(200).json({
      data: orderData?.resellerNote,
      success: true,
      message: "Add note successfully.",
    });
  } catch (err) {
    console.log("*** resellerOrderController: addResellerNote ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE CUSTOMER NOTE
const updateCustomerNote = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $set: {
          customerNote: req.body.customerNote,
        },
      },
      {
        new: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to add note!`,
      });
    }

    return res.status(200).json({
      data: orderData?.customerNote,
      success: true,
      message: "Add note successfully.",
    });
  } catch (err) {
    console.log("*** resellerOrderController: updateCustomerNote ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createPosOrder,
  fetchOrderForUpdate,
  UpdateOrder,

  fetchCustomerAllOrder,
  // pending order
  fetchAllPendingOrder,
  searchPendingOrder,

  // confirm order
  fetchAllOrder,
  searchOrder,

  fetchSingleOrder,
  fetchMultipleOrder,

  // reseller actions
  updateOrderStatusByReseller,
  updateOrderCustomerAddress,
  addResellerNote,
  updateCustomerNote,
};
