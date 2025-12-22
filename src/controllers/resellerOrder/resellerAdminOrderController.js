// const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const { ObjectId } = mongoose.Types;

const ComboModel = require("../../models/comboProduct/combo");
const OrderModel = require("../../models/resellerOrder/resellerOrder");
const ResellerOrderProductModel = require("../../models/resellerOrder/resellerOrderProducts");
const OrderComboModel = require("../../models/resellerOrder/resellerOrderCombo");
const OrderComboProductModel = require("../../models/resellerOrder/resellerOrderComboProduct");
const LogModel = require("../../models/helpers/log");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
const ResellerModel = require("../../models/user/reseller");
// const CustomerModel = require("../../models/user/customer");
const customMetaData = require("../../helpers/customMetaData");
const updateSingleFile = require("../../utils/updateSingleImage");
const { getCustomerCharge } = require("../../helpers/shareFunc");
const { resellerOrderAdminPopulate } = require("../../helpers/allOrderQuery");
const PathaoCityModel = require("../../models/courierServices/pathao/pathaoCity");
const PathaoZoneModel = require("../../models/courierServices/pathao/pathaoZone");
// const CustomerModel = require("../../models/user/customer");
const uploadImage = require("../../utils/upload-img");
const CourierServiceModel = require('../../models/courierServices/courierApi');
const { createSteadfastBulkOrder, creteSteadFastPayload, buildTrackData } = require('../../controllersFunction/steadFastCourier');
const SteadfastTrackModel = require("../../models/order/courierTrack/steadfastTrack");

// const {
//   pendingOrderMsg,
//   confirmOrderMsg,
//   holdOrderMsg,
//   cancelOrderMsg,
// } = require("../../service/smsList");
// const smsSend = require("../../service/smsService");

const orderProjection = {
  serialId: 1,
  customerId: 1,
  products: 1,
  combos: 1,
  orderStatus: 1,
  resellerStatus: 1,
  orderPayStatus: 1,
  resellerPayStatus: 1,
  adminNote: 1,
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
        ...resellerOrderAdminPopulate,
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

// FETCH ORDER FOR UPDATE
const fetchOrderForUpdate = async (req, res) => {
  try {
    const [singleOrderData] = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
        },
      },
      ...resellerOrderAdminPopulate,
    ]);

    if (!singleOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch order data!",
      });
    }
    // return res.json({ singleOrderData });

    const orderData = JSON.parse(JSON.stringify(singleOrderData));

    // check order status meet with - delivery, cancel, return, refund
    let isCancel = true;
    orderData?.orderStatus.forEach((st) => {
      if (["PENDING", "CONFIRM"].includes(st?.status)) {
        isCancel = false;
      }
    });
    if (isCancel) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "This order couldn't be update!",
      });
    }

    const allProducts = [];
    await Promise.all(
      orderData?.products.map(async (prod) => {
        let prodStock = 0;
        prodStock = prod?.product?.nonVariation?.stock;
        if (prod?.isVariant) {
          const variationData = await VariationModel.findOne({ _id: prod?.variationId });
          prodStock = variationData?.variation?.stock;
        }

        const obj = {
          uid: nanoid(),
          productId: prod?.product?._id,
          slug: prod?.product?.slug,
          name: prod?.product?.name,
          isVariant: prod?.isVariant,
          variantId: !prod?.product?.isVariant ? "" : prod?.product?.variation?._id,
          variantName: prod?.variationName,
          quantity: prod?.quantity,
          price: prod?.price,
          subTotal: Number(prod?.quantity) * Number(prod?.price),
          images: !prod?.isVariant ? prod?.product?.galleryImage : prod?.variation?.images,
          sku: prod?.sku,
          stock: prodStock + prod.quantity,
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
    console.log("*** adminOrderController: fetchSingleOrder ***");
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
      if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Must have one product or combo product!",
        });
      }

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
                adminNote: 1,
                orderStatus: 1,
              },
            },
          ]),
          ResellerModel.findOne(
            {
              _id: req.body.resellerId,
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

      if (!checkOrder) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid order data!",
        });
      }

      if (!resellerData) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Invalid reseller data!",
        });
      }

      let isCancel = true;
      checkOrder?.orderStatus.forEach((st) => {
        if (["PENDING", "CONFIRM"].includes(st?.status)) {
          isCancel = false;
        }
      });
      if (isCancel) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "This order couldn't be update!",
        });
      }

      // if (checkAllProducts.length !== req.body.products.length) {
      //   return res.status(409).json({
      //     data: null,
      //     success: false,
      //     message: "There is some invalid products!",
      //   });
      // }

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
          // .... bulk ...
          let proFilterCond = {
            _id: ObjectId(product?.productId),
          };

          if (upStock > 0) {
            proFilterCond = {
              ...proFilterCond,
              "nonVariation.stock": { $gte: Number(upStock) },
              // totalStock: { $gte: Number(upStock) },
            };
          }
          productBulkData.push({
            updateOne: {
              filter: proFilterCond,
              update: {
                $inc: {
                  "nonVariation.stock": -1 * Number(upStock),
                  totalStock: -1 * Number(upStock),
                  totalSell: Number(upStock),
                },
                $set: {
                  isUsed: true,
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundProd?.nonVariation?.stock) < Number(upStock)) {
            errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${upStock} Qty.`;
            break;
          }
        } else {
          const foundVariant = foundProd?.variationData.find(
            (i) => String(i?._id) === String(product?.variationId)
          );

          // .... bulk ...
          let proFilterCond = {
            _id: ObjectId(product?.productId),
          };
          let varFilterCond = {
            _id: ObjectId(product?.variationId),
          };

          if (upStock > 0) {
            proFilterCond = {
              ...proFilterCond,
              // totalStock: { $gte: Number(upStock) },
            };
            varFilterCond = {
              ...varFilterCond,
              stock: { $gte: Number(upStock) },
            };
          }
          productBulkData.push({
            updateOne: {
              filter: proFilterCond,
              update: {
                $inc: {
                  totalStock: -Number(upStock),
                  totalSell: Number(upStock),
                },
              },
            },
          });

          variantBulkData.push({
            updateOne: {
              filter: varFilterCond,
              update: {
                $inc: {
                  stock: -Number(upStock),
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundVariant?.stock) < Number(upStock)) {
            errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You Select ${upStock} Qty.`;
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

        const prevCombo = checkOrder?.combos.find(
          (i) => String(i?.comboId) === String(combo?.comboId)
        );

        let upComboStock = 0;
        if (prevCombo) {
          upComboStock = Number(combo?.quantity) - Number(prevCombo?.quantity);
        } else {
          upComboStock = Number(combo?.quantity);
        }
        comboBulkData.push({
          updateOne: {
            filter: { _id: ObjectId(combo?.comboId) },
            update: {
              $inc: {
                totalSell: -1 * Number(upComboStock),
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

          let upStock = 0;
          if (prevCombo) {
            upStock = Number(combo?.quantity) - Number(prevCombo?.quantity);
          } else {
            upStock = Number(combo?.quantity);
          }

          if (!product?.isVariant) {
            // .... bulk ...
            let proFilterCond = {
              _id: ObjectId(product?.productId),
            };

            if (upStock > 0) {
              proFilterCond = {
                ...proFilterCond,
                "nonVariation.stock": { $gte: Number(upStock) },
                // totalStock: { $gte: Number(upStock) },
              };
            }
            productBulkData.push({
              updateOne: {
                filter: proFilterCond,
                update: {
                  $inc: {
                    "nonVariation.stock": -1 * Number(upStock),
                    totalStock: -1 * Number(upStock),
                    totalSell: Number(upStock),
                    comboSell: Number(upStock),
                  },
                },
              },
            });

            // .... stock ...
            if (Number(foundProd?.nonVariation?.stock) < Number(upStock)) {
              errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You Select ${upStock} Qty.`;
              break;
            }
          } else {
            const foundVariant = foundProd?.variationData.find(
              (i) => String(i?._id) === String(product?.variationId)
            );
            // .... bulk ...
            let proFilterCond = {
              _id: ObjectId(product?.productId),
            };
            let varFilterCond = {
              _id: ObjectId(product?.variationId),
            };

            if (upStock > 0) {
              proFilterCond = {
                ...proFilterCond,
                // totalStock: { $gte: Number(upStock) },
              };
              varFilterCond = {
                ...varFilterCond,
                stock: { $gte: Number(upStock) },
              };
            }
            productBulkData.push({
              updateOne: {
                filter: proFilterCond,
                update: {
                  $inc: {
                    totalStock: -Number(upStock),
                    totalSell: Number(upStock),
                    comboSell: Number(upStock),
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: varFilterCond,
                update: {
                  $inc: {
                    stock: -Number(upStock),
                  },
                },
              },
            });

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

      checkOrder.products.forEach((product) => {
        const foundProd = req.body.products.find(
          (i) =>
            String(i?.productId) === String(product?.productId) &&
            Boolean(i?.isVariant) === Boolean(product?.isVariant)
        );
        if (!foundProd) {
          // adminOrderProductIds.push(product?._id);

          if (!product?.isVariant) {
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    "nonVariation.stock": Number(product?.quantity),
                    totalStock: Number(product?.quantity),
                    totalSell: -1 * Number(product?.quantity),
                  },
                },
              },
            });
          } else {
            // .... bulk ...
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    totalStock: Number(product?.quantity),
                    totalSell: -1 * Number(product?.quantity),
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.variationId) },
                update: {
                  $inc: {
                    stock: Number(product?.quantity),
                  },
                },
              },
            });
          }
        }
      });

      checkOrder.combos.forEach((combo) => {
        const foundCombo = req.body.combos.find(
          (i) => String(i?.comboId) === String(combo?.comboId)
        );

        if (!foundCombo) {
          comboBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(combo?.comboId) },
              update: {
                $inc: {
                  totalSell: -1 * Number(combo?.quantity),
                },
              },
            },
          });
          combo.products.forEach((product) => {
            if (!product?.isVariant) {
              // .... bulk ...
              productBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.productId) },
                  update: {
                    $inc: {
                      "nonVariation.stock": Number(combo?.quantity),
                      totalStock: Number(combo?.quantity),
                      totalSell: -1 * Number(combo?.quantity),
                      comboSell: -1 * Number(combo?.quantity),
                    },
                  },
                },
              });
            } else {
              // .... bulk ...
              productBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.productId) },
                  update: {
                    $inc: {
                      totalStock: Number(combo?.quantity),
                      totalSell: -1 * Number(combo?.quantity),
                      comboSell: -1 * Number(combo?.quantity),
                    },
                  },
                },
              });

              variantBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.variationId) },
                  update: {
                    $inc: {
                      stock: Number(combo?.quantity),
                    },
                  },
                },
              });
            }
          });
        }
      });

      if (req.body.payment.documentImg !== "") {
        req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
      }

      const totalQty = req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0);

      totalWeight /= 1000;
      if (totalWeight < 0.5) {
        totalWeight = 0.5;
      } else if (totalWeight > 10) {
        totalWeight = 10;
      }

      let adminNote = JSON.parse(JSON.stringify(checkOrder?.adminNote)) || [];
      if (req.body.adminNoteMessage) {
        adminNote = [
          ...adminNote,
          {
            message: req.body.adminNoteMessage,
            createdBy: req.user?.role ? "admin" : req?.user?.name,
            time: new Date().toISOString(),
          },
        ];
      }

      const resellerInfo = {
        resellerId: req.body.resellerId,
        profitMoney,
        advanceMoney: 0,
        grandProfit: Number(profitMoney),
      };

      const orderObj = {
        customerId: req.body.customerId,
        adminNote,
        customerNote: req.body.customerNote,
        totalQty,
        totalWeight,
        payment: req.body.payment,
        deliveryType: req.body.deliveryType,
        deliveryAddress: req.body.deliveryAddress,
        customerCharge: getCustomerCharge(req.body.customerCharge),
        resellerInfo,
      };

      const resellerOrderProductIds = checkOrder?.products.map((i) => i?._id);

      const [orderData, productData, variantData] = await Promise.all([
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
        ProductModel.bulkWrite(productBulkData, { session }),
        VariationModel.bulkWrite(variantBulkData, { session }),
        ComboModel.bulkWrite(comboBulkData, { session }),
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
                req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
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

      if (
        (productData.nModified || 0) !== productBulkData.length ||
        (variantData.nModified || 0) !== variantBulkData.length
      ) {
        throw new Error("There is some stock issue!");
      }

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

// FETCH ALL ORDERS
const fetchAllOrderByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
    ];
    // let countMatchCondition = {
    //   resellerStatus: "confirm",
    // };

    const countMatchCondition = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
    ];

    if (req.body.status !== "ALL") {
      matchCondition.push({
        $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, req.body.status],
      });
    }

    if (req.body.createdBy !== "ALL") {
      if (req.body.createdBy === "employee") {
        // matchCondition.push({
        //   $nin: ["$createdBy", ["admin", "customer", "visitor"]],
        // });
      } else {
        matchCondition.push({
          $eq: ["$createdBy", req.body.createdBy],
        });
      }
    }

    if (req.body.courier !== "") {
      matchCondition.push({
        $eq: ["$courierId", ObjectId(req.body.courier)],
      });
    }

    if (req.body.employee !== "") {
      matchCondition.push({
        $eq: ["$employeeId", ObjectId(req.body.employee)],
      });
    }

    if (req.body.resellerId !== "") {
      matchCondition.push({
        $eq: ["$resellerInfo.resellerId", ObjectId(req.body.resellerId)],
      });
      // countMatchCondition = {
      //   ...countMatchCondition,
      //   "resellerInfo.resellerId": ObjectId(req.body.resellerId),
      // };
      countMatchCondition.push({
        $eq: ["$resellerInfo.resellerId", ObjectId(req.body.resellerId)],
      });
    }

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
        ...resellerOrderAdminPopulate,
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
        {
          $match: {
            $expr: {
              $and: countMatchCondition,
            },
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
    console.log("*** adminOrderController: fetchAllOrderByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH ORDERS BY ADMIN
const searchOrderByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
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
    ];

    let countMatchCondition = {
      resellerStatus: "confirm",
    };

    if (req.body.resellerId !== "") {
      matchCondition.push({
        "resellerInfo.resellerId": ObjectId(req.body.resellerId),
      });
      countMatchCondition = {
        ...countMatchCondition,
        "resellerInfo.resellerId": ObjectId(req.body.resellerId),
      };
    }

    // return res.json({ matchCondition });

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        ...resellerOrderAdminPopulate,
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
      OrderModel.countDocuments({
        $and: matchCondition,
      }),
      OrderModel.aggregate([
        {
          $match: countMatchCondition,
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
    console.log("*** adminOrderController: searchOrderByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchSingleOrderByAdmin = async (req, res) => {
  try {
    console.log("hre..");
    const [orderData] = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
          resellerStatus: "confirm",
        },
      },
      ...resellerOrderAdminPopulate,
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
    console.log("*** adminOrderController: fetchSingleOrderByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchMultipleOrderByAdmin = async (req, res) => {
  try {
    const orderData = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $in: req.body.serialIds },
          resellerStatus: "confirm",
        },
      },
      ...resellerOrderAdminPopulate,
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
    console.log("*** adminOrderController: fetchMultipleOrderByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatusByAdmin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const [checkOrderData] = await OrderModel.aggregate([
        {
          $match: {
            _id: ObjectId(req.params.orderId),
            resellerStatus: "confirm",
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
                  pipeline: [
                    {
                      $lookup: {
                        from: "combo_products",
                        let: { pId: "$productId", cId: "$comboId" },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $and: [
                                  { $eq: ["$productId", "$$pId"] },
                                  { $eq: ["$comboId", "$$cId"] },
                                ],
                              },
                            },
                          },
                          {
                            $project: {
                              price: 1,
                            },
                          },
                        ],
                        as: "comboProducts",
                      },
                    },
                    {
                      $unwind: {
                        path: "$comboProducts",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $project: {
                        productId: 1,
                        isVariant: 1,
                        variationId: 1,
                        quantity: 1,
                        price: "$comboProducts.price",
                      },
                    },
                  ],
                  as: "products",
                },
              },
            ],
            as: "combos",
          },
        },
      ]);

      if (!checkOrderData) {
        return res.status(400).json({
          data: null,
          success: true,
          message: "Order not found!",
        });
      }

      const prevStatus = checkOrderData?.orderStatus[checkOrderData.orderStatus.length - 1]?.status;
      if (["CANCELED", "DELIVERED", "RETURNED", "REFUND"].includes(prevStatus)) {
        return res.status(409).json({
          data: null,
          success: true,
          message: `Couldn't '${req.body.status.toLowerCase()}' the order. This order is already in ${prevStatus}`,
        });
      }

      if (
        checkOrderData?.courierInfo?.liveCourier !== "" &&
        checkOrderData?.courierInfo?.courierStatus !== ""
      ) {
        return res.status(409).json({
          data: null,
          success: true,
          message: `Couldn't '${req.body.status.toLowerCase()}' the order. This order is already in ${
            checkOrderData?.courierInfo?.liveCourier
          } courier`,
        });
      }

      const orderStatusObj = {
        status: req.body.status,
        time: new Date().toISOString(),
        changeBy: req.user.role === "admin" ? "admin" : req.user.name,
        employeeId: req.user.role === "admin" ? null : req.user._id,
      };

      let setUpdateObj = {
        $push: {
          orderStatus: orderStatusObj,
        },
      };

      const productBulkData = [];
      const variantBulkData = [];
      const comboBulkData = [];
      if (req.body.status === "DELIVERED") {
        const customerCharge = getCustomerCharge({
          totalProductPrice: checkOrderData?.customerCharge?.totalProductPrice,
          discountPrice: checkOrderData?.customerCharge?.discountPrice,
          deliveryCharge: checkOrderData?.customerCharge?.deliveryCharge,
          totalPayTk: checkOrderData?.customerCharge?.totalBill,
        });

        setUpdateObj = {
          ...setUpdateObj,
          $set: {
            customerCharge,
            orderPayStatus: "paid",
          },
        };

        // fetch all product data
        checkOrderData.products.forEach((product) => {
          if (!product?.isVariant) {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    "nonVariation.sellQty": Number(product?.quantity),
                    "nonVariation.totalSellPrice":
                      Number(product?.quantity) * Number(product?.price),
                  },
                },
              },
            });
          } else {
            variantBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.variationId) },
                update: {
                  $inc: {
                    sellQty: Number(product?.quantity),
                    totalSellPrice: Number(product?.quantity) * Number(product?.price),
                  },
                },
              },
            });
          }
        });

        checkOrderData.combos.forEach((combo) => {
          combo.products.forEach((product) => {
            if (!product?.isVariant) {
              productBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.productId) },
                  update: {
                    $inc: {
                      "nonVariation.sellQty": Number(combo?.quantity),
                      "nonVariation.totalSellPrice":
                        Number(combo?.quantity) * Number(product?.price),
                    },
                  },
                },
              });
            } else {
              variantBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.variationId) },
                  update: {
                    $inc: {
                      sellQty: Number(combo?.quantity),
                      totalSellPrice: Number(combo?.quantity) * Number(product?.price),
                    },
                  },
                },
              });
            }
          });
        });
      } else if (req.body.status === "CANCELED") {
        // fetch all product data
        checkOrderData.products.forEach((product) => {
          if (!product?.isVariant) {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    "nonVariation.stock": Number(product?.quantity),
                    totalStock: Number(product?.quantity),
                    totalSell: -Number(product?.quantity),
                  },
                },
              },
            });
          } else {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    totalStock: Number(product?.quantity),
                    totalSell: -Number(product?.quantity),
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.variationId) },
                update: {
                  $inc: {
                    stock: Number(product?.quantity),
                  },
                },
              },
            });
          }
        });

        checkOrderData.combos.forEach((combo) => {
          combo.products.forEach((product) => {
            if (!product?.isVariant) {
              productBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.productId) },
                  update: {
                    $inc: {
                      "nonVariation.stock": Number(combo?.quantity),
                      totalStock: Number(combo?.quantity),
                      totalSell: -1 * Number(combo?.quantity),
                      comboSell: -1 * Number(combo?.quantity),
                    },
                  },
                },
              });
            } else {
              productBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.productId) },
                  update: {
                    $inc: {
                      totalStock: Number(combo?.quantity),
                      totalSell: -Number(combo?.quantity),
                      comboSell: -1 * Number(combo?.quantity),
                    },
                  },
                },
              });

              variantBulkData.push({
                updateOne: {
                  filter: { _id: ObjectId(product?.variationId) },
                  update: {
                    $inc: {
                      stock: Number(combo?.quantity),
                    },
                  },
                },
              });
            }
          });

          comboBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(combo?.comboId) },
              update: {
                $inc: {
                  totalSell: -1 * Number(combo?.quantity),
                },
              },
            },
          });
        });
      } else if (req.body.status === "RETURNED") {
        setUpdateObj = {
          ...setUpdateObj,
          $set: {
            "returnDetails.isDone": true,
            "returnDetails.returnMoney": checkOrderData?.customerCharge?.deliveryCharge,
          },
        };
      }

      const promiseArr = [
        OrderModel.findOneAndUpdate({ _id: req.params.orderId }, setUpdateObj, {
          new: true,
          session,
        }),
        LogModel.insertMany(
          [
            {
              referObjectId: checkOrderData?._id,
              message: `${
                req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
              } update order status to ${req.body.status.toLowerCase()}`,
              time: new Date().toISOString(),
            },
          ],
          { session }
        ),
      ];

      if (productBulkData.length > 0) {
        promiseArr.push(ProductModel.bulkWrite(productBulkData, { session }));
      }
      if (variantBulkData.length > 0) {
        promiseArr.push(VariationModel.bulkWrite(variantBulkData, { session }));
      }
      if (comboBulkData.length > 0) {
        promiseArr.push(ComboModel.bulkWrite(comboBulkData, { session }));
      }

      const [orderData] = await Promise.all(promiseArr);

      if (!orderData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: `Failed to ${req.body.status} order!`,
        });
      }

      // let message = "";
      // if (req.body.status === "PENDING") {
      //   message = pendingOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
      // } else if (req.body.status === "CONFIRM") {
      //   message = confirmOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
      // } else if (req.body.status === "HOLD") {
      //   message = holdOrderMsg(orderData?.serialId);
      // } else if (req.body.status === "CANCELED") {
      //   message = cancelOrderMsg(orderData?.serialId);
      // }

      // if (message !== "") {
      //   await smsSend(orderData?.deliveryAddress?.phone, message);
      // }

      await session.commitTransaction();
      return res.status(200).json({
        data: orderData,
        success: true,
        message: `'${req.body.status}' the order successfully.`,
      });
    });
  } catch (err) {
    console.log("*** adminOrderController: updateOrderStatusByAdmin ***");
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

const adminUpdateResellerOrderStatusReadyToShip_TO_Shipping = async (req, res) => {
  try {
    const { orders, courierId } = req.body;

    // Fetch courier service data only once
    const courierServiceData = await CourierServiceModel.findOne();
    if (!courierServiceData?.steadfast?.STEADFAST_API_KEY || !courierServiceData?.steadfast?.STEADFAST_SK) {
      return res.status(400).json({
        data: null, success: false,
        message: "Steadfast API and Secret Key are missing.",
      });
    }

    // Find orders in one query and validate them
    const orderData = await OrderModel.find({ resellerStatus: "confirm", _id: { $in: orders } });
    if (orderData.length !== orders.length) {
      return res.status(400).json({ data: null, success: false, message: "Some orders not found!" });
    }

    const hasCourierStatus = orderData.some(order => order?.courierInfo?.courierStatus);
    if (hasCourierStatus) {
      return res.status(400).json({
        data: null, success: false, message: "Some orders have already been sent to the courier!"
      });
    }
      
    // Prepare the payload for Steadfast API
    const steadfastPayload = await creteSteadFastPayload(orderData);

    // Make the API request to Steadfast
    let steadfastResponse;
    try {
      steadfastResponse = await createSteadfastBulkOrder(steadfastPayload, courierServiceData);
    } catch (err) {
      return res.status(400).json({ data: null, success: false, message: err.message });
    }

    // Process the courier response and update orders in bulk
    const courierTrackData = await Promise.all(steadfastResponse.map(async (item) => {
      const order = await OrderModel.findOne({ serialId: item.invoice }, { _id: 1 });
      if (!order) return null;

      const trackData = buildTrackData(order, item, courierId, req.user);
      const courierTrackRecord = await SteadfastTrackModel.create(trackData);

      const courierInfo = {
        courierId,
        clientId: courierServiceData?.steadfast?.STEADFAST_CLIENT_ID,
        consignmentId: courierTrackRecord?.steadfastKeys?.consignment_id,
        liveCourier: "steadfast",
        courierTrackId: courierTrackRecord._id,
        trackId: item.tracking_code,
        courierStatus: item.status,
        time: Date.now(),
      };

      const statusObj = {
        status: 'SHIPPED',
        time: new Date().toISOString(),
        changeBy: req.user.role === "admin" ? "admin" : req.user.name,
        employeeId: req.user.role === "admin" ? null : req.user._id,
      }

      // Bulk update the courier info in the orders
      await OrderModel.findByIdAndUpdate(order._id, { 
        $set: { courierInfo },
        $push: { orderStatus: statusObj }
      }, { new: true });
      return courierTrackRecord;
    }));

    return res.status(200).json({
      data: orders,
      success: true,
      message: 'Moved to SHIPPED successfully!',
    });
    
  } catch (err) {
    console.log("*** adminOrderController: adminUpdateResellerOrderStatusReadyToShip_TO_Shipping ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE MULTIPLE ORDER STATUS
const updateMultipleOrderStatus = async (req, res) => {
  try {
    const checkAllOrderData = await OrderModel.findOne({
      _id: { $in: req.body.orders },
      "orderStatus.status": {
        $nin: ["PENDING", "CONFIRM", "INVOICED"],
      },
    });

    if (checkAllOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Only processing and invoice orders can change the bulk action",
      });
    }

    const [orderData] = await Promise.all([
      OrderModel.updateMany(
        {
          _id: { $in: req.body.orders },
        },
        {
          $push: {
            orderStatus: {
              status: req.body.status,
              time: new Date().toISOString(),
              changeBy: req.user.role === "admin" ? "admin" : req.user.name,
              employeeId: req.user.role === "admin" ? null : req.user._id,
            },
          },
        },
        {
          multi: true,
        }
      ),
      LogModel.insertMany(
        req.body.orders.map((id) => ({
          referObjectId: id,
          message: `${
            req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
          } update order status to ${req.body.status.toLowerCase()}`,
          time: new Date().toISOString(),
        }))
      ),
    ]);

    if (orderData?.nModified <= 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update status",
      });
    }

    return res.status(200).json({
      data: orderData,
      success: true,
      message: `'${req.body.status.toLowerCase()}' selected orders successfully.`,
    });
  } catch (err) {
    console.log("*** adminOrderController: updateMultipleOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER ADVANCE PAYMENT
const updateOrderPaymentInfoByAdmin = async (req, res) => {
  try {
    const orderData = await OrderModel.findOne({
      _id: req.params.orderId,
      resellerStatus: "confirm",
    });

    const docImgUrl = updateSingleFile(
      orderData?.payment?.documentImg,
      req.body.documentImg,
      "public/order/"
    );

    const customerCharge = getCustomerCharge({
      totalProductPrice: orderData?.customerCharge?.totalProductPrice,
      discountPrice: req.body.discountPrice,
      deliveryCharge: req.body.deliveryCharge,
      totalPayTk: req.body.amount,
    });

    const payment = {
      paymentType: req.body.paymentType,
      amount: req.body.amount,
      details: req.body.details,
      documentImg: docImgUrl,
    };

    const [updateOrderData] = await Promise.all([
      OrderModel.findOneAndUpdate(
        {
          _id: req.params.orderId,
        },
        {
          $set: {
            customerCharge,
            payment,
          },
        },
        {
          new: true,
        }
      ),
      LogModel.create({
        referObjectId: orderData?._id,
        message: `${
          req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
        } update payment data.`,
        time: new Date().toISOString(),
      }),
    ]);

    if (!updateOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update order payment!`,
      });
    }

    return res.status(200).json({
      data: updateOrderData,
      success: true,
      message: "Order payment updated successfully.",
    });
  } catch (err) {
    console.log("*** adminOrderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER's CUSTOMER ADDRESS
const updateOrderCustomerAddressByAdmin = async (req, res) => {
  try {
    const [updateOrderData] = await Promise.all([
      OrderModel.findOneAndUpdate(
        {
          _id: req.params.orderId,
          resellerStatus: "confirm",
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
        message: `${
          req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
        }  update customer address.`,
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
    console.log("*** adminOrderController: updateOrderCustomerAddressByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD ORDER NOTE
const addAdminNoteByAdmin = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
        resellerStatus: "confirm",
      },
      {
        $push: {
          adminNote: {
            $each: [
              {
                message: req.body.note,
                createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
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
      data: orderData?.adminNote,
      success: true,
      message: "Add note successfully.",
    });
  } catch (err) {
    console.log("*** adminOrderController: addAdminNoteByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE CUSTOMER NOTE
const updateCustomerNoteByAdmin = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
        resellerStatus: "confirm",
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
    console.log("*** adminOrderController: updateCustomerNoteByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE COURIER
const updateCourierByAdmin = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
        resellerStatus: "confirm",
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update courier!`,
      });
    }

    return res.status(200).json({
      data: orderData,
      success: true,
      message: "Courier updated successfully.",
    });
  } catch (err) {
    console.log("*** adminOrderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ================== maker order paid ======================
// SEARCH ORDERS BY SERIAL ID
const searchDeliveryOrder = async (req, res) => {
  try {
    const matchCondition = {
      $and: [
        {
          $eq: ["$serialId", req.params.serialId],
        },
        {
          $eq: ["$resellerStatus", "confirm"],
        },
        {
          $eq: ["$orderPayStatus", "unpaid"],
        },
        {
          $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "DELIVERED"],
        },
      ],
    };

    const [orderData] = await OrderModel.aggregate([
      {
        $match: {
          $expr: matchCondition,
        },
      },
      ...resellerOrderAdminPopulate,
      {
        $project: orderProjection,
      },
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch search order!",
      });
    }

    return res.status(200).json({
      data: orderData,
      message: "Fetch search orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** adminOrderController: searchDeliveryOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// MAKE ORDER PAID
const makeDeliveryOrderPaid = async (req, res) => {
  try {
    const matchCondition = {
      $and: [
        {
          $in: ["$_id", req.body.orderIds.map((i) => ObjectId(i))],
        },
        {
          $or: [
            {
              $ne: ["$resellerStatus", "confirm"],
            },
            {
              $ne: ["$orderPayStatus", "unpaid"],
            },
            {
              $ne: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "DELIVERED"],
            },
          ],
        },
      ],
    };

    const checkOrderData = await OrderModel.findOne({
      $expr: matchCondition,
    });

    if (checkOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Some product not meet the conditions.",
      });
    }

    const orderData = await OrderModel.updateMany(
      {
        _id: { $in: req.body.orderIds.map((i) => ObjectId(i)) },
      },
      {
        $set: {
          orderPayStatus: "paid",
        },
      },
      {
        multi: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to paid all orders!",
      });
    }

    return res.status(200).json({
      data: orderData,
      message: "Paid all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** adminOrderController: makeDeliveryOrderPaid ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  fetchCustomerAllOrder,
  fetchOrderForUpdate,
  UpdateOrder,
  fetchAllOrderByAdmin,
  searchOrderByAdmin,
  fetchSingleOrderByAdmin,
  fetchMultipleOrderByAdmin,

  // -- update actions --
  updateOrderStatusByAdmin, // pending, cancel confirm, process, picked, shipped, delivered
  adminUpdateResellerOrderStatusReadyToShip_TO_Shipping,
  updateMultipleOrderStatus,
  updateOrderPaymentInfoByAdmin,
  updateOrderCustomerAddressByAdmin,
  addAdminNoteByAdmin,
  updateCustomerNoteByAdmin,
  updateCourierByAdmin,

  // make order: paid
  searchDeliveryOrder,
  makeDeliveryOrderPaid,
};
