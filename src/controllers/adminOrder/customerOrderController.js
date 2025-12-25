  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const mongoose = require("mongoose");

  const { ObjectId } = mongoose.Types;
  const { customAlphabet } = require("nanoid");

  const customBarCode = customAlphabet("0123456789", 17);
  const { pendingOrderMsg, orderVerificationMsg, orderConfirmationMsg } = require("../../service/smsList");

  const IncompleteOrderModel = require("../../models/adminOrder/adminOrderIncomplete");
  const ComboModel = require("../../models/comboProduct/combo");
  const OrderModel = require("../../models/adminOrder/adminOrder");
  const OrderComboModel = require("../../models/adminOrder/adminOrderCombo");
  const OrderComboProductModel = require("../../models/adminOrder/adminOrderComboProduct");
  const AdminOrderProductModel = require("../../models/adminOrder/adminOrderProducts");
  const AdminOrderProductIncompleteModel = require("../../models/adminOrder/adminOrderProductsIncomplete");
  const LogModel = require("../../models/helpers/log");
  const CustomerModel = require("../../models/user/customer");
  const ProductModel = require("../../models/product/product");
  const VariationModel = require("../../models/product/variation");
  const { promoVerify } = require("../../helpers/promoQuery");
  const customMetaData = require("../../helpers/customMetaData");
  const { adminOrderSerialNumber, getCustomerCharge, getCustomerChargeForOnlinePayment } = require("../../helpers/shareFunc");
  const PathaoCityModel = require("../../models/courierServices/pathao/pathaoCity");
  const PathaoZoneModel = require("../../models/courierServices/pathao/pathaoZone");
  const PromoModel = require("../../models/product/promo");

  const uploadImage = require("../../utils/upload-img");
  const smsSend = require("../../service/smsService");
  const { transformFlatFieldsToArrays } = require("../../helpers/productAssists");
  const { adminOrderPopulate, adminIncompleteOrderPopulate } = require("../../helpers/allOrderQuery");
  const initPayment = require("../../service/aamarPay/initiatePayment");
  const AdminOrderVerificationModel = require('../../models/adminOrder/adminOrderVerification');
  const { refundBkashOrder } = require("../../service/onlinePayment/bkash");
  const axios = require("axios");
  const { bKashAccess } = require("../../config/bkashConfig");
  const { authHeader, executePayment, queryPayment } = require("../../helpers/bkash");
  const BkashModel = require("../../models/onlinePayment/bkash");
  const OnlineOrderFakeModel = require("../../models/onlinePayment/onlineOrderFake");
  const OnlinePaymentHistoryModel = require("../../models/onlinePayment/onlinePaymentHistory");

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

  const orderOtpSend = async (req, res) => {
    try {
      console.log('req.user ================', req.user)
      const checkVerifyData = await AdminOrderVerificationModel.findOne({ phone: req.body.phone });
      if (checkVerifyData) {
        const codeExpireTime = new Date(checkVerifyData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; // min
        const currentTime = new Date().getTime();
        if (codeExpireTime >= currentTime) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Already send an otp to your phone!",
          });
        }
    
        const nanoid = customAlphabet("1234567890", 6);
        const otpCode = nanoid(6);
    
        await AdminOrderVerificationModel.findOneAndUpdate({phone: req.body.phone}, {$set: {otpCode: otpCode}});
    
        await smsSend(req.body.phone, orderVerificationMsg(otpCode));
    
        return res.status(201).json({
          data: '',
          success: true,
          message: "OTP send to your phone",
        });
      } else {
        const nanoid = customAlphabet("1234567890", 6);
        const otpCode = nanoid(6);
    
        await AdminOrderVerificationModel.create({
          phone: req.body.phone,
          otpCode
        })
    
        await smsSend(req.body.phone, orderVerificationMsg(otpCode));
    
        return res.status(201).json({
          data: '',
          success: true,
          message: "Otp send to your phone!",
        });
      }
    }
    catch(error) {
      console.log('orderOtpSend error ', error);
      return res.status(500).json({
        data: null,
        success: false,
        message: "Internal Server Error Occurred.",
      });
    }
  }

  const orderOtpVerify = async (req, res) => {
    try {
      const checkVerifyData = await AdminOrderVerificationModel.findOne({ phone: req.body.phone, otpCode: req.body.otpCode });
      if (!checkVerifyData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "OTP didn't match!",
        });
      }
    
      await AdminOrderVerificationModel.findOneAndDelete({phone: req.body.phone, otpCode: req.body.otpCode});
      return res.status(200).json({
        data: {
          phone: req.body.phone,
          otpCode: req.body.otpCode
        },
        success: true,
        message: "OTP verify success!",
      });
    }
    catch(error) {
      console.log('orderOtpVerify error ', error);
      return res.status(500).json({
        data: null,
        success: false,
        message: "Internal Server Error Occurred.",
      });
    }
  }

  const onlinePaymentHistoryCreate = async (payload, paymentProvider, status) => {
    try {
      if (paymentProvider === "SSL Commerz") {
        const obj = {
          paymentProvider,
          paymentStatus: payload?.status,
          transactionId: payload?.tran_id,
          paymentID: null,
          paymentInfo: payload,
          status,
          refundTransactionId: null
        };
        await OnlinePaymentHistoryModel.create(obj);
      } else if (paymentProvider === "BKash") {
        const obj = {
          paymentProvider,
          paymentStatus: payload?.status,
          transactionId: payload?.tran_id,
          paymentID: payload?.paymentID,
          paymentInfo: payload?.paymentInfo || payload,
          status,
          refundTransactionId: payload?.refundTransactionId || null
        };
        await OnlinePaymentHistoryModel.create(obj);
      }
    } catch (error) {
      console.log("onlinePaymentHistoryCreate ========= ", error);
    }
  };

  const createAdminCustomerOrderBkash = async (req, res) => {
    try {
      const {bkashAppKey, bkashAppSecret, bkashPassword, bkashUsername, isBkashActive} = await BkashModel.findOne({});
      if (!isBkashActive || !bkashAppKey || !bkashAppSecret || !bkashPassword || !bkashUsername) {
        return res.status(400).json({
          success: false, url: null, message: "BKash is deactivated!"
        });
      }

      const data = req.body;
      if (+data?.customerCharge?.totalProductPrice < 1) {
        return res.status(400).json({
          success: false, url: null, message: "Total product price must be greater than 0!"
        });
      }
      const bkashConfigObj = {
        bkashAppKey,
        bkashAppSecret,
        bkashPassword,
        bkashUsername,
        bkashUrl: `https://tokenized${process.env.NODE_ENV === "dev" ? ".sandbox" : ".pay"}.bka.sh/v1.2.0-beta`
      };
      const mainUrl = process.env.NODE_ENV === "dev" ? `${req.protocol}://${req.get("host")}` : `https://${req.get("host")}`;
      const transactionId = `${new Date().setMilliseconds(0)}_${new mongoose.Types.ObjectId()}`;
      const amountPay = getCustomerChargeForOnlinePayment(data.customerCharge);

      const fullUrl = bkashConfigObj.bkashUrl.concat(`${bKashAccess.payment}`);
      const authHeaders = await authHeader(bkashConfigObj);

      const body = {
        mode: "0011",
        payerReference: transactionId,
        callbackURL: `${mainUrl}/api/v1/admin-order/customer/create-bkash-callback`,
        amount: amountPay.totalBill || 0,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: transactionId
      };
      const response = await axios.post(fullUrl, body, authHeaders);

      if (response?.data && response?.data?.bkashURL && response?.data?.paymentID) {
        req.body.status = "initial";
        req.body.tran_id = transactionId;
        req.body.paymentID = response?.data?.paymentID;
        req.body.bkashResponse = response?.data;
        req.body.checkoutPageSessionId = req.session.checkoutPageSessionId;
        req.body.payment = {
          amount: amountPay.totalBill, paymentType: 'bkash online'
        }
        req.body.reqUser = {
          role: req.body?.customerId ? 'customer' : 'visitor',
          _id: req.body?.customerId || null
        }

        let token = null;
        if(req.body.customerId === null) {
          const existingCustomer = await CustomerModel.findOne({ phone: req.body.deliveryAddress.phone });

          if(existingCustomer) {
            req.body.customerId = existingCustomer?._id;
            token = jwt.sign({
              _id: existingCustomer?._id,
              userName: existingCustomer?.userName,
              role: "customer",
            }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
          } else {
            const hashPassword = await bcrypt.hash(req.body.deliveryAddress.phone, 12);
            const [customerData] = await CustomerModel.create(
              [
                {
                  ...req.body.deliveryAddress,
                  userName: req.body.deliveryAddress.phone,
                  password: hashPassword,
                },
              ],
              { session }
            );
            req.body.customerId = customerData?._id;
            token = jwt.sign({
              _id: customerData?._id,
              userName: customerData?.userName,
              role: "customer",
            }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
          }
        }

        await Promise.all([
          OnlineOrderFakeModel.create({ ...req.body, paymentAmount: amountPay.totalBill }),
          onlinePaymentHistoryCreate(req.body, "BKash", "initial 1st")
        ]);

        return res.status(200).json({
          success: true,
          message: "Payment initialized successfully!",
          url: response.data.bkashURL,
          data: { token }
        });
      }
      return res.status(400).json({
        success: false,
        message: "Failed to initialize payment!",
        url: null
      });
    }
    catch(error) {
      console.log('createAdminCustomerOrderBkash error ', error);
      return res.status(500).json({
        data: null,
        success: false,
        message: "Internal Server Error Occurred.",
      });
    }
  }

  const createAdminCustomerOrderBkashCallback = async (req, res) => {
    const { paymentID, status } = req.query;
    const fakeOrderData = await OnlineOrderFakeModel.findOne({ paymentID });
    
    let mainUrl = fakeOrderData.host;
    if (!mainUrl.startsWith('http://') && !mainUrl.startsWith('https://')) {
      const protocol = process.env.NODE_ENV === "dev" ? "http" : "https";
      mainUrl = `${protocol}://${mainUrl}`;
    }
    try {
      req.query.paymentStatus = 'processing 1st';
      req.query.transactionId = fakeOrderData.tran_id;
      const [bkashConfig] = await Promise.all([
          await BkashModel.findOne({}),
          onlinePaymentHistoryCreate(req.query, "BKash", "initial 2nd")
      ]);
      const { bkashAppKey, bkashAppSecret, bkashPassword, bkashUsername } = bkashConfig;
      if (status !== "success") {
          const onlinePaymentData = await OnlinePaymentHistoryModel.findOne({ paymentID });
          onlinePaymentData.paymentStatus = status;
          const obj = {
              status: status,
              tran_id: onlinePaymentData?.transactionId,
              paymentID: onlinePaymentData?.paymentID,
              paymentInfo: onlinePaymentData?.paymentInfo
          };
          await Promise.all([
              OnlineOrderFakeModel.findOneAndDelete({ paymentID }),
              onlinePaymentHistoryCreate(obj, "BKash", status)
          ]);
          return res.redirect(`${mainUrl}/checkout?payment=failed`);
      }
      const bkashUrl = `https://tokenized${process.env.NODE_ENV === "dev" ? ".sandbox" : ".pay"}.bka.sh/v1.2.0-beta`;
      const bkashConfigObj = { bkashAppKey, bkashAppSecret, bkashPassword,  bkashUsername, bkashUrl };
      req.query.paymentStatus = 'processing 2nd';
      await onlinePaymentHistoryCreate(req.query, "BKash", "initial 3rd")

      const authHeaders = await authHeader(bkashConfigObj);
      const executePaymentResponse = await executePayment(paymentID, authHeaders, bkashConfigObj);

      if (executePaymentResponse?.transactionStatus && executePaymentResponse?.transactionStatus === "Completed") {
        const executeResponseObj = {
          status: executePaymentResponse?.transactionStatus,
          tran_id: executePaymentResponse?.trxID,
          paymentID: executePaymentResponse?.paymentID,
          paymentInfo: executePaymentResponse
        };
        await Promise.all([
          OnlineOrderFakeModel.findOneAndDelete({ paymentID }),
          onlinePaymentHistoryCreate(executeResponseObj, "BKash", "completed")
        ]);
        delete fakeOrderData._id;
        delete fakeOrderData.createdAt;
        delete fakeOrderData.updatedAt;
        req.body = fakeOrderData;
        req.user = fakeOrderData.reqUser;

          const MONGOOSE_ID = new mongoose.Types.ObjectId();
    
          if (req.user.role === "customer" && req.user._id !== req.body.customerId) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          if(req.body.customerId === '') req.body.customerId = null;
          if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          const startTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
          const selectedProductIds = req.body.products.map((i) => ObjectId(i?.productId));
          const selectedComboProductIds = req.body.combos
            .map((item) => item?.products.map((prod) => ObjectId(prod?.productId)))
            .flat();
          const [
            checkAllProducts,
            checkAllCombos,
            cityData,
            zoneData,
            totalOrder,
            totalDuplicate,
            promoData,
            customerPromoUsed,
          ] = await Promise.all([
          ProductModel.aggregate([
            {
              $match: {
                $and: [
                  {
                    $or: [
                      { _id: { $in: [...selectedProductIds, ...selectedComboProductIds] } },
                      { _id: { $in: [...selectedProductIds, ...selectedComboProductIds].map(id => String(id)) } },
                    ],
                  },
                  { isDeleted: { $in: [false, "false", null] } },
                ],
              },
            },
            ...transformFlatFieldsToArrays,
              {
                $lookup: {
                  from: "variations",
                  localField: "variations",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $match: {
                        isDeleted: { $in: [false, "false", null] },
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
                  categories: 1,
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
              }
            ),
            PathaoCityModel.findOne({ _id: ObjectId(req.body.deliveryAddress.cityId) }),
            PathaoZoneModel.findOne({ _id: ObjectId(req.body.deliveryAddress.zoneId) }),
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
              "deliveryAddress.phone": req.body.deliveryAddress.phone,
              promoCode: { $regex: `^${req.body.promo}$`, $options: "i" },
            }),
          ]);
          if (!cityData) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          if (!zoneData) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          if (req.body.promo !== "" && !promoData) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          let totalWeight = 0;
          let sumOfTotalProductPrice = 0;
          const productBulkData = [];
          const variantBulkData = [];
          let errorMessage = "";
    
          const allProducts = [];
          for (const product of req.body.products) {
            const foundProd = checkAllProducts.find(
              (i) => String(i?._id) === String(product?.productId)
            );
    
            // product check - normalize isVariant for comparison (handle string "true"/"false" from CSV import)
            const foundIsVariant = typeof foundProd?.isVariant === 'string' 
              ? foundProd.isVariant === 'true' || foundProd.isVariant === 'True' || foundProd.isVariant === 'TRUE'
              : Boolean(foundProd?.isVariant);
            const productIsVariant = Boolean(product?.isVariant);
            
            if (!foundProd || foundIsVariant !== productIsVariant) {
              console.log(`Product validation failed: productId=${product?.productId}, foundProd=${!!foundProd}, foundIsVariant=${foundIsVariant} (${typeof foundProd?.isVariant}), productIsVariant=${productIsVariant} (${typeof product?.isVariant})`);
              errorMessage = "There is some invalid products!";
              break;
            }
    
            if (!productIsVariant) {
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
            sumOfTotalProductPrice += Number(product?.price) * Number(product?.quantity);
    
            allProducts.push({
              ...product.toObject(),
              variationId: product?.variationId === "" ? null : product?.variationId,
            });
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
    
              // product check - normalize isVariant for comparison (handle string "true"/"false" from CSV import)
              const foundIsVariant = typeof foundProd?.isVariant === 'string' 
                ? foundProd.isVariant === 'true' || foundProd.isVariant === 'True' || foundProd.isVariant === 'TRUE'
                : Boolean(foundProd?.isVariant);
              const productIsVariant = Boolean(product?.isVariant);
              
              if ((!foundProd || foundIsVariant !== productIsVariant) && errorMessage === "") {
                console.log(`Product validation failed: productId=${product?.productId}, foundProd=${!!foundProd}, foundIsVariant=${foundIsVariant} (${typeof foundProd?.isVariant}), productIsVariant=${productIsVariant} (${typeof product?.isVariant})`);
                errorMessage = "There is some invalid products!";
              }
    
              if (!productIsVariant) {
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
                      // totalStock: { $gte: Number(combo?.quantity) },
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
            sumOfTotalProductPrice += Number(combo?.price) * Number(combo?.quantity);
    
            allCombos.push({
              _id: ORDER_COMBO_ID,
              orderId: MONGOOSE_ID,
              comboId: combo?.comboId,
              quantity: combo?.quantity,
              price: combo?.price,
            });
          }
          if (errorMessage !== "") {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          if (Number(sumOfTotalProductPrice) !== Number(req.body.customerCharge.totalProductPrice)) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          if (req.body.promo !== "") {
            if (
              promoData?.userLimitInfo?.haveLimit &&
              promoData?.userLimitInfo?.maxUsed <= customerPromoUsed
            ) {
              const [refundResponse] = await Promise.all([
                refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
                onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
              ])
              return res.redirect(`${mainUrl}/checkout?payment=failed`);
            }
            const promoResponse = promoVerify(
              promoData,
              req.body.deliveryAddress.phone,
              req.body.products,
              req.body.combos,
              checkAllProducts
            );
            if (promoResponse?.promoType === "invalid") {
              const [refundResponse] = await Promise.all([
                refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
                onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
              ])
              return res.redirect(`${mainUrl}/checkout?payment=failed`);
            }
            if (promoResponse?.promoType === "free_delivery") {
              if (req.body.customerCharge.discountPrice !== 0) {
                const [refundResponse] = await Promise.all([
                  refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
                  onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
                ])
                return res.redirect(`${mainUrl}/checkout?payment=failed`);
              }
              if (req.body.customerCharge.deliveryCharge !== 0) {
                const [refundResponse] = await Promise.all([
                  refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
                  onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
                ])
                return res.redirect(`${mainUrl}/checkout?payment=failed`);
              }
            } else if (promoResponse?.discount !== req.body.customerCharge.discountPrice) {
              const [refundResponse] = await Promise.all([
                refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
                onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
              ])
              return res.redirect(`${mainUrl}/checkout?payment=failed`);
            }
          } else if (req.body.promo === "" && req.body.customerCharge.discountPrice !== 0) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          let token = null;
          if(req.body.customerId === null) {
            const existingCustomer = await CustomerModel.findOne({ phone: req.body.deliveryAddress.phone });
            if(existingCustomer) {
              req.body.customerId = existingCustomer?._id;
              token = jwt.sign({
                _id: existingCustomer?._id,
                userName: existingCustomer?.userName,
                role: "customer",
              }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
            } else {
              const hashPassword = await bcrypt.hash(req.body.deliveryAddress.phone, 12);
              const [customerData] = await CustomerModel.create(
                [
                  {
                    ...req.body.deliveryAddress,
                    userName: req.body.deliveryAddress.phone,
                    password: hashPassword,
                  },
                ],
              );
              req.body.customerId = customerData?._id;
              token = jwt.sign({
                _id: customerData?._id,
                userName: customerData?.userName,
                role: "customer",
              }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
            }
          }
          // if (req.body.payment.documentImg !== "") {
          //   req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
          // }
          const serialId = await adminOrderSerialNumber(totalOrder);
          const totalQty =
            req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0) +
            req.body.combos.reduce((prev, cur) => prev + Number(cur.quantity), 0);
    
          totalWeight /= 1000;
          if (totalWeight < 0.5) {
            totalWeight = 0.5;
          } else if (totalWeight > 10) {
            totalWeight = 10;
          }
          let orderStatus = {
            status: "PENDING",
            time: new Date().toISOString(),
            changeBy: req.user.role,
            employeeId: null,
          };
    
          let orderObj = {
            _id: MONGOOSE_ID,
            serialId,
            barCode: customBarCode(17),
            customerId: req.body.customerId,
            products: allProducts,
            customerNote: req.body.customerNote,
            orderStatus: [orderStatus],
            totalQty,
            totalWeight,
            payment: req.body.payment,
            deliveryType: req.body.deliveryType,
            promoCode: req.body.promo.toLowerCase(),
            deliveryAddress: req.body.deliveryAddress,
            customerCharge: getCustomerChargeForOnlinePayment(req.body.customerCharge),
            employeeId: null,
            createdBy: req.user.role,
            duplicateNumber: totalDuplicate || 0,
            onlinePayment: executePaymentResponse,
            orderPayStatus: 'paid'
          };
          // if (!req.body.onlinePaymentReq) {
          //   res.status(201).json({
          //     data: {
          //       _id: MONGOOSE_ID,
          //       serialId,
          //       deliveryAddress: req.body.deliveryAddress,
          //       customerCharge: getCustomerCharge(req.body.customerCharge),
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
            origin: "main",
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
            OrderModel.insertMany([orderObj]),
            ProductModel.bulkWrite(productBulkData),
            VariationModel.bulkWrite(variantBulkData),
            AdminOrderProductModel.insertMany(
              allProducts.map((i) => ({
                ...i,
                orderId: MONGOOSE_ID,
              })),
            ),
            LogModel.insertMany(
              [
                {
                  referObjectId: MONGOOSE_ID,
                  message: `${req.user.role} create this order.`,
                  time: new Date().toISOString(),
                },
              ],
            ),
            OrderComboModel.insertMany(allCombos),
            OrderComboProductModel.insertMany(allComboProducts),
            ComboModel.bulkWrite(comboBulkData),
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
                { new: true }
              )
            );
          }
          const [orderData, productData, variantData] = await Promise.all(promiseArr);
          if (!orderData) {
            const [refundResponse] = await Promise.all([
              refundBkashOrder({ amount: fakeOrderData.paymentAmount, paymentID, trxID: executePaymentResponse?.trxID, sku: "", reason: "" }),
              onlinePaymentHistoryCreate({ ...executeResponseObj, refundTransactionId: refundResponse?.refundTrxID }, "BKash", "refunded")
            ])
            return res.redirect(`${mainUrl}/checkout?payment=failed`);
          }
          // if (
          //   (productData.nModified || 0) !== productBulkData.length ||
          //   (variantData.nModified || 0) !== variantBulkData.length
          // ) {
          //   throw new Error("There is some stock issue!");
          // }
    
          if(req.body?.visitorId){
            await Promise.all([
              IncompleteOrderModel.deleteMany({ visitorId: req.body.visitorId }),
              AdminOrderProductIncompleteModel.deleteMany({ visitorId: req.body.visitorId }),
            ]);
          }
          const message = orderConfirmationMsg(serialId);
          if (message !== "") {
            await smsSend(orderObj?.deliveryAddress?.phone, message);
          }
          return res.redirect(`${mainUrl}/thank-you/${payObj?.serialId}/${fakeOrderData?.paymentAmount}/${payObj?.userName}?payment=success`);
      } else {
        return res.redirect(`${mainUrl}/checkout?payment=failed`);
      }
    }
    catch(error) {
      console.log('createAdminCustomerOrderBkashCallback error ', error);      
      const onlinePaymentHistory = await OnlinePaymentHistoryModel.findOne({ paymentProvider: 'BKash', status: 'completed'}, { transactionId : 1, paymentID : 1, "paymentInfo.amount" : 1 }).sort({ createdAt: -1 });
      if(onlinePaymentHistory) {
        const refudnData = await refundBkashOrder({ amount: onlinePaymentHistory?.paymentInfo?.amount, paymentID: onlinePaymentHistory?.paymentID, trxID: onlinePaymentHistory?.transactionId, sku: "", reason: "" });
        if(refudnData) {
          const payload = {
            paymentStatus: 'refunded',
            transactionId: onlinePaymentHistory?.transactionId,
            paymentID: onlinePaymentHistory?.paymentID,
            paymentInfo: refudnData,
            refundTransactionId: refudnData?.refundTrxID,
          }
          await onlinePaymentHistoryCreate(payload, "BKash", "refunded")
        }
      }
      return res.redirect(`${mainUrl}/checkout?payment=failed`);
    }
  }

  // CREATE CUSTOMER ORDER
  const createAdminCustomerOrder = async (req, res) => {
    // CRITICAL FIX: Make transactions optional for local standalone MongoDB
    // Check if we should use transactions (only if replica set is available)
    const USE_TRANSACTIONS = process.env.USE_TRANSACTIONS === 'true' || process.env.NODE_ENV === 'production';
    const session = USE_TRANSACTIONS ? await mongoose.startSession() : null;

    try {
      // Wrapper function that runs with or without transaction
      const executeOrderCreation = async () => {
        const MONGOOSE_ID = new mongoose.Types.ObjectId();
        const sessionOptions = session ? { session } : {};
        
        console.log("📦 Order creation started:", {
          orderId: MONGOOSE_ID.toString(),
          productsCount: req.body.products?.length || 0,
          combosCount: req.body.combos?.length || 0,
          customerId: req.body.customerId || 'visitor',
        });

        if (req.user.role === "customer" && req.user._id !== req.body.customerId) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Unauthorize customer. Check it from frontend!",
          });
        }

        if(req.body.customerId === '') req.body.customerId = null;

        // Defensive checks for required data
        if (!req.body.products || !Array.isArray(req.body.products)) {
          console.error("❌ Invalid products array:", req.body.products);
          return res.status(400).json({
            data: null,
            success: false,
            message: "Invalid products data. Products must be an array.",
          });
        }

        if (!req.body.combos || !Array.isArray(req.body.combos)) {
          console.error("❌ Invalid combos array:", req.body.combos);
          return res.status(400).json({
            data: null,
            success: false,
            message: "Invalid combos data. Combos must be an array.",
          });
        }

        if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
          console.error("❌ Empty cart: no products or combos");
          return res.status(409).json({
            data: null,
            success: false,
            message: "Must have one product or combo product!",
          });
        }

        if (!req.body.deliveryAddress) {
          console.error("❌ Missing delivery address");
          return res.status(400).json({
            data: null,
            success: false,
            message: "Delivery address is required.",
          });
        }

        if (!req.body.customerCharge) {
          console.error("❌ Missing customer charge data");
          return res.status(400).json({
            data: null,
            success: false,
            message: "Customer charge data is required.",
          });
        }

        const startTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
        
        // Ensure MongoDB connection is ready
        if (mongoose.connection.readyState !== 1) {
          console.error("❌ MongoDB connection not ready. State:", mongoose.connection.readyState);
          return res.status(500).json({
            data: null,
            success: false,
            message: "Database connection not ready. Please try again.",
          });
        }
        
        // Handle both string and ObjectId productIds from frontend
        const selectedProductIds = req.body.products.map((i) => {
          if (!i?.productId) return null;
          try {
            // Try to convert to ObjectId
            if (typeof i.productId === 'string' && i.productId.length === 24) {
              return ObjectId(i.productId);
            }
            return ObjectId(i.productId);
          } catch (err) {
            // If ObjectId conversion fails, return as-is (might be ObjectId already)
            return i.productId;
          }
        }).filter(id => id !== null);
        
        const selectedComboProductIds = req.body.combos
          .map((item) => item?.products?.map((prod) => {
            if (!prod?.productId) return null;
            try {
              if (typeof prod.productId === 'string' && prod.productId.length === 24) {
                return ObjectId(prod.productId);
              }
              return ObjectId(prod.productId);
            } catch (err) {
              return prod.productId;
            }
          }) || [])
          .flat()
          .filter(id => id !== null);

        // Only query products if we have product IDs
        if (selectedProductIds.length === 0 && selectedComboProductIds.length === 0) {
          return res.status(409).json({
            data: null,
            success: false,
            message: "No valid product IDs found in request.",
          });
        }

        const [
          checkAllProducts,
          checkAllCombos,
          cityData,
          zoneData,
          totalOrder,
          totalDuplicate,
          promoData,
          customerPromoUsed,
        ] = await Promise.all([
          ProductModel.aggregate([
            {
              $match: {
                $and: [
                  {
                    _id: { $in: [...selectedProductIds, ...selectedComboProductIds] },
                  },
                  { isDeleted: { $in: [false, "false", null] } },
                  { isOwnDisabled: { $in: [false, "false", null] } },
                ],
              },
            },
            ...transformFlatFieldsToArrays,
            {
              $lookup: {
                from: "variations",
                localField: "variations",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      isDeleted: { $in: [false, "false", null] },
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
                _id: 1, // Explicitly include _id to ensure it's returned as ObjectId
                name: 1,
                weight: 1,
                isFlashDeal: 1,
                isVariant: 1,
                nonVariation: 1,
                variationData: 1,
                categories: 1,
              },
            },
          ]).option({ allowDiskUse: true, maxTimeMS: 30000 }),
          ComboModel.find(
            {
              _id: { $in: req.body.combos.map((item) => ObjectId(item?.comboId)) },
            },
            {
              name: 1,
              sellingPrice: 1,
              products: 1,
            }
          ),
          PathaoCityModel.findById(req.body.deliveryAddress.cityId),
          PathaoZoneModel.findById(req.body.deliveryAddress.zoneId),
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
            "deliveryAddress.phone": req.body.deliveryAddress.phone,
            promoCode: { $regex: `^${req.body.promo}$`, $options: "i" },
          }),
        ]);

        if (!cityData) {
          console.error("❌ City validation failed:", {
            cityId: req.body.deliveryAddress?.cityId,
            deliveryAddress: req.body.deliveryAddress,
          });
          return res.status(409).json({
            data: null,
            success: false,
            message: `Invalid city data! City ID: ${req.body.deliveryAddress?.cityId || 'missing'}`,
          });
        }

        if (!zoneData) {
          console.error("❌ Zone validation failed:", {
            zoneId: req.body.deliveryAddress?.zoneId,
            cityId: req.body.deliveryAddress?.cityId,
            deliveryAddress: req.body.deliveryAddress,
          });
          return res.status(409).json({
            data: null,
            success: false,
            message: `Invalid zone data! Zone ID: ${req.body.deliveryAddress?.zoneId || 'missing'}`,
          });
        }

        if (req.body.promo !== "" && !promoData) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Inactive promo code!",
          });
        }

        let totalWeight = 0;
        let sumOfTotalProductPrice = 0;
        const productBulkData = [];
        const variantBulkData = [];
        let errorMessage = "";

        // Debug: Log incoming request
        console.log("=== ORDER CREATION DEBUG ===");
        console.log("Request products count:", req.body.products?.length);
        console.log("Request products:", JSON.stringify(req.body.products.map(p => ({ productId: p.productId, isVariant: p.isVariant, type: typeof p.isVariant })), null, 2));
        console.log("CheckAllProducts count:", checkAllProducts?.length);
        console.log("CheckAllProducts IDs:", checkAllProducts?.map(p => ({ id: String(p._id), isVariant: p.isVariant, type: typeof p.isVariant, name: p.name })));

        const allProducts = [];
        for (const product of req.body.products) {
          // Try multiple ID matching strategies (handle both string and ObjectId)
          const productIdStr = String(product?.productId);
          let foundProd = checkAllProducts.find((i) => {
            const dbIdStr = String(i?._id);
            return dbIdStr === productIdStr;
          });
          
          // If not found, try ObjectId comparison
          if (!foundProd) {
            try {
              const productIdObj = ObjectId(product?.productId);
              foundProd = checkAllProducts.find((i) => {
                return String(i?._id) === String(productIdObj);
              });
            } catch (err) {
              // ObjectId conversion failed, continue with string comparison
            }
          }

          console.log(`\n--- Product Validation ---`);
          console.log(`Product ID from request: ${product?.productId} (type: ${typeof product?.productId})`);
          console.log(`Product ID as string: ${productIdStr}`);
          console.log(`Found product: ${!!foundProd}`);
          if (foundProd) {
            console.log(`Found product ID: ${String(foundProd._id)}`);
            console.log(`Found product name: ${foundProd.name}`);
            console.log(`Found product isVariant: ${foundProd.isVariant} (type: ${typeof foundProd.isVariant})`);
          } else {
            console.error(`❌ Product not found! productId=${product?.productId}`);
            console.error(`Available product IDs:`, checkAllProducts.map(p => String(p._id)));
            errorMessage = `Product not found: ${product?.productId}. Available IDs: ${checkAllProducts.map(p => String(p._id)).join(', ')}`;
            break;
          }
          console.log(`Request product isVariant: ${product?.isVariant} (type: ${typeof product?.isVariant})`);

          // product check - normalize isVariant for comparison (handle string "true"/"false" from CSV import)
          const foundIsVariant = typeof foundProd?.isVariant === 'string' 
            ? (foundProd.isVariant === 'true' || foundProd.isVariant === 'True' || foundProd.isVariant === 'TRUE' || foundProd.isVariant === '1')
            : Boolean(foundProd?.isVariant);
          const productIsVariant = typeof product?.isVariant === 'string'
            ? (product.isVariant === 'true' || product.isVariant === 'True' || product.isVariant === 'TRUE' || product.isVariant === '1')
            : Boolean(product?.isVariant);
          
          console.log(`Normalized foundIsVariant: ${foundIsVariant} (was: ${foundProd?.isVariant})`);
          console.log(`Normalized productIsVariant: ${productIsVariant} (was: ${product?.isVariant})`);
          
          if (foundIsVariant !== productIsVariant) {
            console.error(`❌ isVariant mismatch! foundIsVariant=${foundIsVariant}, productIsVariant=${productIsVariant}`);
            errorMessage = `Product ${foundProd?.name || product?.productId} - isVariant mismatch! Found: ${foundIsVariant}, Requested: ${productIsVariant}`;
            break;
          }
          
          console.log(`✅ Product validation passed`);

          if (!productIsVariant) {
            // Normalize stock values for comparison
            const currentStock = Number(foundProd?.nonVariation?.stock) || 0;
            const requestedQty = Number(product?.quantity) || 0;
            
            console.log(`📦 Stock check for ${foundProd?.name}:`, {
              currentStock,
              requestedQty,
              stockType: typeof foundProd?.nonVariation?.stock,
              quantityType: typeof product?.quantity,
            });

            // .... stock validation FIRST (before adding to bulk data) ...
            if (currentStock < requestedQty) {
              errorMessage = `${foundProd?.name} - has ${currentStock} Qty. You Select ${requestedQty} Qty.`;
              console.error(`❌ Insufficient stock: ${currentStock} < ${requestedQty}`);
              break;
            }

            // Build bulk write operation
            // CRITICAL: Create fresh ObjectId from string representation for maximum reliability
            // This ensures we have a proper ObjectId instance that will work with bulkWrite
            let productIdForBulk;
            try {
              // Convert to string first, then create fresh ObjectId - this is most reliable
              const productIdStr = String(foundProd._id);
              productIdForBulk = new mongoose.Types.ObjectId(productIdStr);
              // Verify it's actually an ObjectId
              if (!(productIdForBulk instanceof mongoose.Types.ObjectId)) {
                throw new Error(`Failed to create ObjectId from: ${productIdStr}`);
              }
            } catch (err) {
              errorMessage = `${foundProd?.name} - Invalid product ID format: ${foundProd._id}`;
              console.error(`❌ Invalid product ID: ${foundProd._id}`, err);
              break;
            }
            
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: productIdForBulk, // Proper ObjectId instance for bulkWrite
                },
                update: {
                  $inc: {
                    "nonVariation.stock": -requestedQty,
                    totalStock: -requestedQty,
                    totalSell: requestedQty,
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });
            
            console.log(`✅ Added bulk write for product ${foundProd?.name}:`, {
              productId: String(productIdForBulk),
              productIdType: productIdForBulk instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof productIdForBulk,
              productIdConstructor: productIdForBulk?.constructor?.name,
              currentStock,
              decrementQty: requestedQty,
            });

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
            
            if (!foundVariant) {
              errorMessage = `${foundProd?.name} - variation not found: ${product?.variationId}`;
              console.error(`❌ Variant not found: ${product?.variationId}`);
              break;
            }

            // Normalize variant stock values for comparison
            const variantCurrentStock = Number(foundVariant?.stock) || 0;
            const variantRequestedQty = Number(product?.quantity) || 0;
            
            console.log(`📦 Variant stock check for ${foundProd?.name} (${product?.variationName}):`, {
              currentStock: variantCurrentStock,
              requestedQty: variantRequestedQty,
              stockType: typeof foundVariant?.stock,
            });

            // Stock validation FIRST (before adding to bulk data)
            if (variantCurrentStock < variantRequestedQty) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${variantCurrentStock} Qty. You Select ${variantRequestedQty} Qty.`;
              console.error(`❌ Insufficient variant stock: ${variantCurrentStock} < ${variantRequestedQty}`);
              break;
            }

            // Build bulk write operations - create fresh ObjectIds from string representations
            // CRITICAL: Create fresh ObjectId instances for maximum reliability with bulkWrite
            let productIdForBulk;
            let variationIdForBulk;
            try {
              // Convert to string first, then create fresh ObjectId - this is most reliable
              const productIdStr = String(foundProd._id);
              const variationIdStr = String(foundVariant._id);
              productIdForBulk = new mongoose.Types.ObjectId(productIdStr);
              variationIdForBulk = new mongoose.Types.ObjectId(variationIdStr);
              // Verify they're actually ObjectIds
              if (!(productIdForBulk instanceof mongoose.Types.ObjectId)) {
                throw new Error(`Failed to create ObjectId from productId: ${productIdStr}`);
              }
              if (!(variationIdForBulk instanceof mongoose.Types.ObjectId)) {
                throw new Error(`Failed to create ObjectId from variationId: ${variationIdStr}`);
              }
            } catch (err) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - Invalid ID format: productId=${foundProd._id}, variationId=${foundVariant._id}`;
              console.error(`❌ Invalid IDs:`, err);
              break;
            }
            
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: productIdForBulk, // Proper ObjectId instance for bulkWrite
                },
                update: {
                  $inc: {
                    totalStock: -variantRequestedQty,
                    totalSell: variantRequestedQty,
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
                  _id: variationIdForBulk, // Proper ObjectId instance for bulkWrite
                },
                update: {
                  $inc: {
                    stock: -variantRequestedQty,
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });
            
            console.log(`✅ Added bulk write for variant ${foundProd?.name} (${product?.variationName}):`, {
              productId: String(productIdForBulk),
              productIdType: productIdForBulk instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof productIdForBulk,
              variationId: String(variationIdForBulk),
              variationIdType: variationIdForBulk instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof variationIdForBulk,
              currentStock: variantCurrentStock,
              decrementQty: variantRequestedQty,
            });

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
          sumOfTotalProductPrice += Number(product?.price) * Number(product?.quantity);

          allProducts.push({
            ...product,
            variationId: product?.variationId === "" ? null : product?.variationId,
          });
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

            // product check - normalize isVariant for comparison (handle string "true"/"false" from CSV import)
            const foundIsVariant = typeof foundProd?.isVariant === 'string' 
              ? foundProd.isVariant === 'true' || foundProd.isVariant === 'True' || foundProd.isVariant === 'TRUE'
              : Boolean(foundProd?.isVariant);
            const productIsVariant = Boolean(product?.isVariant);
            
            if ((!foundProd || foundIsVariant !== productIsVariant) && errorMessage === "") {
              console.log(`Product validation failed: productId=${product?.productId}, foundProd=${!!foundProd}, foundIsVariant=${foundIsVariant} (${typeof foundProd?.isVariant}), productIsVariant=${productIsVariant} (${typeof product?.isVariant})`);
              errorMessage = "There is some invalid products!";
            }

            if (!productIsVariant) {
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
                    // totalStock: { $gte: Number(combo?.quantity) },
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

          sumOfTotalProductPrice += Number(combo?.price) * Number(combo?.quantity);

          allCombos.push({
            _id: ORDER_COMBO_ID,
            orderId: MONGOOSE_ID,
            comboId: combo?.comboId,
            quantity: combo?.quantity,
            price: combo?.price,
          });
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

        let token = null;
        if(req.body.customerId === null) {
          const existingCustomer = await CustomerModel.findOne({ phone: req.body.deliveryAddress.phone });

          if(existingCustomer) {
            req.body.customerId = existingCustomer?._id;
            token = jwt.sign({
              _id: existingCustomer?._id,
              userName: existingCustomer?.userName,
              role: "customer",
            }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
          } else {
            const hashPassword = await bcrypt.hash(req.body.deliveryAddress.phone, 12);
            const [customerData] = await CustomerModel.create(
              [
                {
                  ...req.body.deliveryAddress,
                  userName: req.body.deliveryAddress.phone,
                  password: hashPassword,
                },
              ],
              { session }
            );
            req.body.customerId = customerData?._id;
            token = jwt.sign({
              _id: customerData?._id,
              userName: customerData?.userName,
              role: "customer",
            }, process.env.TOKEN_SECRET, { expiresIn: "365d" });
          }
        }

        if (req.body.payment.documentImg !== "") {
          req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
        }

        const serialId = await adminOrderSerialNumber(totalOrder);
        const totalQty =
          req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0) +
          req.body.combos.reduce((prev, cur) => prev + Number(cur.quantity), 0);

        totalWeight /= 1000;
        if (totalWeight < 0.5) {
          totalWeight = 0.5;
        } else if (totalWeight > 10) {
          totalWeight = 10;
        }

        let orderStatus = {
          status: "PENDING",
          time: new Date().toISOString(),
          changeBy: req.user.role,
          employeeId: null,
        };

        if (req.body.payment.paymentType !== "cash") {
          orderStatus = {
            status: "HOLD",
            time: new Date().toISOString(),
            changeBy: req.user.role,
            employeeId: null,
          };
        }

        let orderObj = {
          _id: MONGOOSE_ID,
          serialId,
          barCode: customBarCode(17),
          customerId: req.body.customerId,
          products: allProducts,
          customerNote: req.body.customerNote,
          orderStatus: [orderStatus],
          totalQty,
          totalWeight,
          payment: req.body.payment,
          deliveryType: req.body.deliveryType,
          promoCode: req.body.promo.toLowerCase(),
          deliveryAddress: req.body.deliveryAddress,
          customerCharge: getCustomerCharge(req.body.customerCharge),
          employeeId: null,
          createdBy: req.user.role,
          duplicateNumber: totalDuplicate || 0,
        };

        // if (!req.body.onlinePaymentReq) {
        //   res.status(201).json({
        //     data: {
        //       _id: MONGOOSE_ID,
        //       serialId,
        //       deliveryAddress: req.body.deliveryAddress,
        //       customerCharge: getCustomerCharge(req.body.customerCharge),
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
          origin: "main",
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

        // Defensive check: ensure bulk data arrays exist
        if (!productBulkData || !Array.isArray(productBulkData)) {
          console.error("❌ Invalid productBulkData:", productBulkData);
          return res.status(500).json({
            data: null,
            success: false,
            message: "Internal error: Product bulk data is invalid.",
          });
        }

        if (!variantBulkData || !Array.isArray(variantBulkData)) {
          console.error("❌ Invalid variantBulkData:", variantBulkData);
          return res.status(500).json({
            data: null,
            success: false,
            message: "Internal error: Variant bulk data is invalid.",
          });
        }

        console.log("📊 Bulk write operations:", {
          products: productBulkData.length,
          variants: variantBulkData.length,
          combos: comboBulkData?.length || 0,
        });

        // CRITICAL FIX: Use individual findOneAndUpdate calls instead of bulkWrite
        // bulkWrite with session seems to have issues matching documents
        // Using findOneAndUpdate ensures proper session handling and better error reporting
        console.log("🔍 Preparing individual product updates (using findOneAndUpdate with session):");
        const productUpdatePromises = productBulkData.map(async (op, idx) => {
          // Use the ObjectId directly from bulk data (already validated)
          const productIdObj = op.updateOne.filter._id;
          const update = op.updateOne.update;
          
          // Verify it's an ObjectId
          if (!(productIdObj instanceof mongoose.Types.ObjectId)) {
            console.error(`❌ Invalid productId type for operation ${idx + 1}:`, typeof productIdObj);
            return { matched: 0, modified: 0, error: 'Invalid productId type' };
          }
          
          console.log(`Updating product ${idx + 1}:`, {
            id: String(productIdObj),
            isObjectId: productIdObj instanceof mongoose.Types.ObjectId,
            updateKeys: Object.keys(update),
          });
          
          try {
            // Use findByIdAndUpdate which is more reliable than updateOne
            // This ensures we're using the exact same ObjectId instance
            const updateOptions = {
              runValidators: false,
              new: false, // Return original document
              ...(session ? { session } : {}),
            };
            
            console.log(`🔍 Attempting update with findByIdAndUpdate:`, {
              _id: String(productIdObj),
              _idType: productIdObj instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof productIdObj,
              updateKeys: Object.keys(update),
            });
            
            // Use findByIdAndUpdate instead of updateOne for better reliability
            const updatedProduct = await ProductModel.findByIdAndUpdate(
              productIdObj,
              update,
              updateOptions
            );
            
            if (updatedProduct) {
              console.log(`✅ Product ${idx + 1} updated successfully: ${String(productIdObj)}`);
              return { matched: 1, modified: 1 };
            } else {
              // Query product to see why it didn't match
              const dbProductCheck = await ProductModel.findById(productIdObj).lean();
              console.error(`❌ Product ${idx + 1} update failed: ${String(productIdObj)}`);
              console.error(`Product DB state:`, {
                exists: !!dbProductCheck,
                isDeleted: dbProductCheck?.isDeleted,
                isOwnDisabled: dbProductCheck?.isOwnDisabled,
                isActive: dbProductCheck?.isActive,
                _id: dbProductCheck ? String(dbProductCheck._id) : 'N/A',
                stock: dbProductCheck?.nonVariation?.stock,
              });
              
              return { matched: 0, modified: 0, error: 'Product not found or update failed' };
            }
          } catch (err) {
            console.error(`❌ Error updating product ${idx + 1} (${String(productIdObj)}):`, err);
            return { matched: 0, modified: 0, error: err.message };
          }
        });
        
        const variantUpdatePromises = variantBulkData.map(async (op, idx) => {
          const variationId = op.updateOne.filter._id;
          const update = op.updateOne.update;
          
          // Ensure variationId is ObjectId
          let variationIdObj;
          try {
            variationIdObj = variationId instanceof mongoose.Types.ObjectId 
              ? variationId 
              : new mongoose.Types.ObjectId(String(variationId));
          } catch (err) {
            console.error(`❌ Invalid variationId for operation ${idx + 1}:`, err);
            return { matched: 0, modified: 0, error: err.message };
          }
          
          try {
            // CRITICAL FIX: Query variant WITHOUT session first to verify it exists
            const dbVariantCheck = await VariationModel.findById(variationIdObj).lean();
            if (!dbVariantCheck) {
              console.error(`❌ Variant ${idx + 1} NOT FOUND in database: ${String(variationIdObj)}`);
              return { matched: 0, modified: 0, error: 'Variant not found in database' };
            }
            
            // Use updateOne WITHOUT session if transactions disabled, WITH session if enabled
            const updateOptions = {
              runValidators: false,
              ...(session ? { session } : {}),
            };
            
            const result = await VariationModel.updateOne(
              { _id: variationIdObj },
              update,
              updateOptions
            );
            
            const matched = result.matchedCount || 0;
            const modified = result.modifiedCount || 0;
            
            return matched > 0 
              ? { matched, modified } 
              : { matched: 0, modified: 0, error: 'Variant update filter did not match' };
          } catch (err) {
            console.error(`❌ Error updating variant ${idx + 1} (${String(variationIdObj)}):`, err);
            return { matched: 0, modified: 0, error: err.message };
          }
        });

        const promiseArr = [
          OrderModel.insertMany([orderObj], sessionOptions),
          Promise.all(productUpdatePromises).then(results => {
            const matchedCount = results.reduce((sum, r) => sum + (r.matched || 0), 0);
            const modifiedCount = results.reduce((sum, r) => sum + (r.modified || 0), 0);
            const errors = results.filter(r => r.error).map(r => r.error);
            console.log(`📊 Product update results: ${matchedCount}/${productBulkData.length} matched, ${modifiedCount} modified`);
            if (errors.length > 0) {
              console.error(`❌ Product update errors:`, errors);
            }
            return {
              matchedCount,
              modifiedCount,
              errors,
              results, // Include full results for debugging
            };
          }),
          Promise.all(variantUpdatePromises).then(results => {
            const matchedCount = results.reduce((sum, r) => sum + (r.matched || 0), 0);
            const modifiedCount = results.reduce((sum, r) => sum + (r.modified || 0), 0);
            const errors = results.filter(r => r.error).map(r => r.error);
            console.log(`📊 Variant update results: ${matchedCount}/${variantBulkData.length} matched, ${modifiedCount} modified`);
            if (errors.length > 0) {
              console.error(`❌ Variant update errors:`, errors);
            }
            return {
              matchedCount,
              modifiedCount,
              errors,
              results, // Include full results for debugging
            };
          }),
          AdminOrderProductModel.insertMany(
            allProducts.map((i) => ({
              ...i,
              orderId: MONGOOSE_ID,
            })),
            sessionOptions
          ),
          LogModel.insertMany(
            [
              {
                referObjectId: MONGOOSE_ID,
                message: `${req.user.role} create this order.`,
                time: new Date().toISOString(),
              },
            ],
            sessionOptions
          ),
          OrderComboModel.insertMany(allCombos, sessionOptions),
          OrderComboProductModel.insertMany(allComboProducts, sessionOptions),
          ComboModel.bulkWrite(comboBulkData, sessionOptions),
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
              { new: true, ...sessionOptions }
            )
          );
        }

        // Before bulk write, verify product IDs are correct ObjectId type
        // NOTE: We already have products from aggregation, so we don't need to query again
        // Querying inside transaction can cause isolation issues
        console.log("🔍 Pre-bulk-write ID verification:");
        for (const op of productBulkData) {
          const productId = op.updateOne.filter._id;
          const productIdStr = String(productId);
          
          // Find product in aggregation results (we already validated it exists)
          const foundProd = checkAllProducts.find(p => String(p._id) === productIdStr);
          
          console.log(`Product ID in bulk write:`, {
            id: productIdStr,
            type: typeof productId,
            isObjectId: productId instanceof mongoose.Types.ObjectId,
            constructor: productId?.constructor?.name,
            foundInAggregation: !!foundProd,
            aggregationId: foundProd ? String(foundProd._id) : null,
            idsMatch: foundProd ? String(foundProd._id) === productIdStr : false,
            name: foundProd?.name || 'N/A',
          });
          
          if (!foundProd) {
            console.error(`❌ Product ${productIdStr} not found in aggregation results!`);
          } else if (String(foundProd._id) !== productIdStr) {
            console.error(`❌ ID mismatch! Aggregation: ${String(foundProd._id)}, Bulk: ${productIdStr}`);
          }
        }
        for (const op of variantBulkData) {
          const variationId = op.updateOne.filter._id;
          const variationIdStr = String(variationId);
          
          console.log(`Variant ID in bulk write:`, {
            id: variationIdStr,
            type: typeof variationId,
            isObjectId: variationId instanceof mongoose.Types.ObjectId,
            constructor: variationId?.constructor?.name,
          });
          
          // Variants are already validated in aggregation results (foundProd.variationData)
          // No need to query again inside transaction
        }

        const [orderData, productData, variantData] = await Promise.all(promiseArr);

        if (!orderData || !orderData.length) {
          console.error("❌ Order creation failed: orderData is null or empty");
          return res.status(400).json({
            data: null,
            success: false,
            message: "Failed to create order!",
          });
        }

        // findOneAndUpdate returns aggregated results with matchedCount and modifiedCount
        const productModifiedCount = productData?.modifiedCount ?? 0;
        const variantModifiedCount = variantData?.modifiedCount ?? 0;
        const productMatchedCount = productData?.matchedCount ?? 0;
        const variantMatchedCount = variantData?.matchedCount ?? 0;
        
        // Log any errors from individual updates
        if (productData?.errors && productData.errors.length > 0) {
          console.error("Product update errors:", productData.errors);
        }
        if (variantData?.errors && variantData.errors.length > 0) {
          console.error("Variant update errors:", variantData.errors);
        }

        console.log("=== BULK WRITE VALIDATION ===");
        console.log(`Product bulk operations: ${productBulkData.length}`);
        console.log(`Product matched: ${productMatchedCount}, modified: ${productModifiedCount}`);
        console.log(`Variant bulk operations: ${variantBulkData.length}`);
        console.log(`Variant matched: ${variantMatchedCount}, modified: ${variantModifiedCount}`);
        console.log("Full productData response:", JSON.stringify(productData, null, 2));
        console.log("Full variantData response:", JSON.stringify(variantData, null, 2));

        // Check if all operations matched by ID (we removed stock filter since stock is validated earlier)
        if (productMatchedCount !== productBulkData.length) {
          console.error(`❌ Product update failed: ${productMatchedCount}/${productBulkData.length} operations matched`);
          console.error("Product bulk data filters:", productBulkData.map(op => ({
            productId: String(op.updateOne.filter._id),
            productIdType: typeof op.updateOne.filter._id,
            filterKeys: Object.keys(op.updateOne.filter),
          })));
          
          // Find which products failed to match by ID
          const failedProducts = [];
          for (let i = 0; i < productBulkData.length; i++) {
            const op = productBulkData[i];
            const productId = String(op.updateOne.filter._id);
            const foundProd = checkAllProducts.find(p => String(p._id) === productId);
            if (!foundProd) {
              failedProducts.push({
                name: 'Unknown',
                productId,
                reason: 'Product not found in database by ID',
              });
            } else {
              // Product exists but bulk write didn't match - query database to check actual status
              let dbProduct = null;
              try {
                dbProduct = await ProductModel.findById(productId).lean();
              } catch (err) {
                console.error(`Error querying product ${productId}:`, err);
              }
              
              const isDeleted = dbProduct ? (dbProduct.isDeleted === true || dbProduct.isDeleted === "true") : foundProd.isDeleted;
              const isDisabled = dbProduct ? (dbProduct.isOwnDisabled === true || dbProduct.isOwnDisabled === "true") : false;
              
              failedProducts.push({
                name: foundProd.name,
                productId,
                dbId: String(foundProd._id),
                dbStatus: dbProduct ? {
                  isDeleted: dbProduct.isDeleted,
                  isOwnDisabled: dbProduct.isOwnDisabled,
                  isActive: dbProduct.isActive,
                } : null,
                reason: isDeleted ? 'Product is deleted in database' : (isDisabled ? 'Product is disabled in database' : 'ID type mismatch or filter condition not met'),
              });
            }
          }
          
          const errorMsg = failedProducts.length > 0
            ? `Product update failed: ${failedProducts.map(p => `${p.name} (ID: ${p.productId}${p.reason ? ` - ${p.reason}` : ''}${p.dbStatus ? ` [DB: deleted=${p.dbStatus.isDeleted}, disabled=${p.dbStatus.isOwnDisabled}]` : ''})`).join(', ')}`
            : `Product update failed: ${productBulkData.length - productMatchedCount} product(s) could not be updated.`;
          
          console.error("Failed products details:", JSON.stringify(failedProducts, null, 2));
          return res.status(409).json({
            data: null,
            success: false,
            message: errorMsg,
          });
        }

        if (variantBulkData.length > 0 && variantMatchedCount !== variantBulkData.length) {
          console.error(`❌ Variant update failed: ${variantMatchedCount}/${variantBulkData.length} operations matched`);
          console.error("Variant bulk data filters:", variantBulkData.map(op => ({
            variationId: String(op.updateOne.filter._id),
            variationIdType: typeof op.updateOne.filter._id,
            filterKeys: Object.keys(op.updateOne.filter),
          })));
          return res.status(409).json({
            data: null,
            success: false,
            message: `Variant update failed: ${variantBulkData.length - variantMatchedCount} variant(s) could not be updated. This may indicate variant ID mismatch or variant was deleted/disabled.`,
          });
        }

        // Verify modifications (should match matched count for updateOne operations)
        if (productModifiedCount !== productBulkData.length) {
          console.warn(`⚠️ Product modifications (${productModifiedCount}) don't match operations (${productBulkData.length}), but matched count is correct`);
        }

        if (variantBulkData.length > 0 && variantModifiedCount !== variantBulkData.length) {
          console.warn(`⚠️ Variant modifications (${variantModifiedCount}) don't match operations (${variantBulkData.length}), but matched count is correct`);
        }

        if(req.body?.visitorId){
          await Promise.all([
            IncompleteOrderModel.deleteMany({ visitorId: req.body.visitorId }),
            AdminOrderProductIncompleteModel.deleteMany({ visitorId: req.body.visitorId }),
          ]);
        }

        if (!req.body.onlinePaymentReq) {
          res.status(201).json({
            data: {
              _id: MONGOOSE_ID,
              serialId,
              deliveryAddress: req.body.deliveryAddress,
              customerCharge: getCustomerCharge(req.body.customerCharge),
              token,
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

        // Commit transaction if active (only if using transactions)
        if (session && session.inTransaction && session.inTransaction()) {
          await session.commitTransaction();
          console.log("✅ Transaction committed successfully");
        } else if (!session) {
          console.log("ℹ️ Order created without transaction (local dev mode)");
        }

        // Send SMS notification (non-blocking, don't fail order if SMS fails)
        try {
          const message = pendingOrderMsg(serialId, orderObj?.customerCharge?.remainingTkPay);
          if (message !== "") {
            await smsSend(orderObj?.deliveryAddress?.phone, message);
            console.log("✅ SMS notification sent");
          }
        } catch (smsErr) {
          console.warn("⚠️ SMS notification failed (non-critical):", smsErr.message);
        }

        console.log("✅ Order created successfully:", {
          orderId: MONGOOSE_ID.toString(),
          serialId,
          totalProducts: allProducts.length,
          totalCombos: allCombos.length,
        });

        return {};
      };
      
      // Execute with or without transaction
      if (USE_TRANSACTIONS && session) {
        console.log("🔄 Executing order creation WITH transaction...");
        return await session.withTransaction(executeOrderCreation, {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 1 }
        }).catch(async (transactionError) => {
          // If transaction fails due to replica set requirement, fall back to non-transaction
          if (transactionError.message && (
            transactionError.message.includes('replica set') ||
            transactionError.message.includes('Transaction numbers') ||
            transactionError.code === 20 ||
            transactionError.originalError?.code === 20
          )) {
            console.log("⚠️ MongoDB transactions require a replica set. Falling back to non-transaction mode.");
            console.log("   Set USE_TRANSACTIONS=false in .env to disable transactions for local dev.");
            if (session) {
              try {
                await session.endSession();
              } catch (sessionErr) {
                console.log("Session end error (ignored):", sessionErr.message);
              }
            }
            // Retry without transaction
            return await executeOrderCreation();
          }
          throw transactionError;
        });
      } else {
        console.log("🔄 Executing order creation WITHOUT transaction (local dev mode)...");
        return await executeOrderCreation();
      }
    } catch (err) {
        console.log("*** adminCustomerOrderController: createAdminCustomerOrder ***");
        console.log("ERROR:", err);
        try {
          if (session && session.inTransaction && session.inTransaction()) {
            await session.abortTransaction();
          }
        } catch (abortErr) {
          // Transaction already aborted or not started
          console.log("Transaction abort error (ignored):", abortErr.message);
        }
      return res.status(500).json({
        data: null,
        success: false,
        message: "Internal Server Error Occurred.",
      });
    } finally {
      // Only end session if it exists (transactions might be disabled)
      if (session) {
        try {
          session.endSession();
        } catch (sessionErr) {
          console.log("Session end error (ignored):", sessionErr.message);
        }
      }
    }
  };

  // CREATE CUSTOMER ORDER
  const createAdminCustomerIncompleteOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        const MONGOOSE_ID = new mongoose.Types.ObjectId();

        if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
          return res.status(409).json({
            data: null,
            success: false,
            message: "Must have one product or combo product!",
          });
        }

        const startTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const selectedProductIds = req.body.products.map((i) => ObjectId(i?.productId));

        const checkAllProducts = await ProductModel.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [
                    { _id: { $in: [...selectedProductIds] } },
                    { _id: { $in: [...selectedProductIds].map(id => String(id)) } },
                  ],
                },
                { isDeleted: { $in: [false, "false", null] } },
                { isOwnDisabled: { $in: [false, "false", null] } },
                { isActive: { $in: [true, "true", 1] } },
              ],
            },
          },
          ...transformFlatFieldsToArrays,
          {
            $lookup: {
              from: "variations",
              localField: "variations",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    isDeleted: { $in: [false, "false", null] },
                  },
                },
                {
                  $project: {
                    _id: 1, // Explicitly include _id to ensure it's returned as ObjectId
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
              _id: 1, // Explicitly include _id to ensure it's returned as ObjectId
              name: 1,
              weight: 1,
              isFlashDeal: 1,
              isVariant: 1,
              nonVariation: 1,
              variationData: 1,
              categories: 1,
            },
          },
        ]);

        let totalWeight = 0;
        let sumOfTotalProductPrice = 0;
        const productBulkData = [];
        const variantBulkData = [];
        let errorMessage = "";

        const allProducts = [];
        for (const product of req.body.products) {
          const foundProd = checkAllProducts.find(
            (i) => String(i?._id) === String(product?.productId)
          );

          // product check - normalize isVariant for comparison (handle string "true"/"false" from CSV import)
          const foundIsVariant = typeof foundProd?.isVariant === 'string' 
            ? foundProd.isVariant === 'true' || foundProd.isVariant === 'True' || foundProd.isVariant === 'TRUE'
            : Boolean(foundProd?.isVariant);
          const productIsVariant = Boolean(product?.isVariant);
          
          if (!foundProd || foundIsVariant !== productIsVariant) {
            console.log(`Product validation failed: productId=${product?.productId}, foundProd=${!!foundProd}, foundIsVariant=${foundIsVariant} (${typeof foundProd?.isVariant}), productIsVariant=${productIsVariant} (${typeof product?.isVariant})`);
            errorMessage = "There is some invalid products!";
            break;
          }

          if (!productIsVariant) {
            // Stock validation FIRST (before adding to bulk data)
            const currentStock = Number(foundProd?.nonVariation?.stock) || 0;
            const requestedQty = Number(product?.quantity) || 0;
            
            if (currentStock < requestedQty) {
              errorMessage = `${foundProd?.name} - has ${currentStock} Qty. You Select ${requestedQty} Qty.`;
              break;
            }

            // Build bulk write operation - convert aggregation result _id to proper ObjectId instance
            // Note: create-incomplete doesn't actually execute bulkWrite, but we build it for consistency
            // CRITICAL: Mongoose aggregation can return _id as plain object, so we need explicit conversion
            let productIdForBulk;
            try {
              productIdForBulk = foundProd._id instanceof mongoose.Types.ObjectId 
                ? foundProd._id 
                : new mongoose.Types.ObjectId(foundProd._id);
            } catch (err) {
              errorMessage = `${foundProd?.name} - Invalid product ID format: ${foundProd._id}`;
              console.error(`❌ Invalid product ID: ${foundProd._id}`, err);
              break;
            }
            
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: productIdForBulk, // Proper ObjectId instance for bulkWrite
                  // No stock filter - we already validated stock above
                },
                update: {
                  $inc: {
                    "nonVariation.stock": -requestedQty,
                    totalStock: -requestedQty,
                    totalSell: requestedQty,
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });

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
            
            if (!foundVariant) {
              errorMessage = `${foundProd?.name} - variation not found: ${product?.variationId}`;
              break;
            }

            // Stock validation FIRST (before adding to bulk data)
            const variantCurrentStock = Number(foundVariant?.stock) || 0;
            const variantRequestedQty = Number(product?.quantity) || 0;
            
            if (variantCurrentStock < variantRequestedQty) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${variantCurrentStock} Qty. You Select ${variantRequestedQty} Qty.`;
              break;
            }

            // Build bulk write operations - convert aggregation result IDs to proper ObjectId instances
            // CRITICAL: Mongoose aggregation can return _id as plain object, so we need explicit conversion
            let productIdForBulk;
            let variationIdForBulk;
            try {
              productIdForBulk = foundProd._id instanceof mongoose.Types.ObjectId 
                ? foundProd._id 
                : new mongoose.Types.ObjectId(foundProd._id);
              variationIdForBulk = foundVariant._id instanceof mongoose.Types.ObjectId 
                ? foundVariant._id 
                : new mongoose.Types.ObjectId(foundVariant._id);
            } catch (err) {
              errorMessage = `${foundProd?.name}(${product?.variationName}) - Invalid ID format: productId=${foundProd._id}, variationId=${foundVariant._id}`;
              console.error(`❌ Invalid IDs:`, err);
              break;
            }
            
            productBulkData.push({
              updateOne: {
                filter: {
                  _id: productIdForBulk, // Proper ObjectId instance for bulkWrite
                  // No stock filter - we already validated stock above
                },
                update: {
                  $inc: {
                    totalStock: -variantRequestedQty,
                    totalSell: variantRequestedQty,
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
                  _id: variationIdForBulk, // Proper ObjectId instance for bulkWrite
                  // No stock filter - we already validated stock above
                },
                update: {
                  $inc: {
                    stock: -variantRequestedQty,
                  },
                  $set: {
                    isUsed: true,
                  },
                },
              },
            });

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

          sumOfTotalProductPrice += Number(product?.price) * Number(product?.quantity);

          allProducts.push({
            ...product,
            variationId: product?.variationId === "" ? null : product?.variationId,
          });
        }

        console.log("sumOfTotalProductPrice", sumOfTotalProductPrice);
        console.log("req.body.customerCharge.totalProductPrice", req.body.customerCharge.totalProductPrice);

        if (Number(sumOfTotalProductPrice) !== Number(req.body.customerCharge.totalProductPrice)) {
          return res.status(409).json({
            data: null,
            success: false,
            message: "Wrong calculation in total product price!",
          });
        }

        const totalQty = req.body.products.reduce((prev, cur) => prev + Number(cur.quantity), 0);

        const orderStatus = {
          status: "PENDING",
          time: new Date().toISOString(),
          changeBy: 'customer',
          employeeId: null,
        };

        const orderObj = {
          _id: MONGOOSE_ID,
          visitorId: req.body.visitorId,
          sequenceNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
          products: allProducts,
          orderStatus: [orderStatus],
          totalQty,
          deliveryAddress: req.body.deliveryAddress,
          customerCharge: getCustomerCharge(req.body.customerCharge),
          bodyData: req.body,
        };

        const promiseArr = [
          IncompleteOrderModel.insertMany([orderObj], { session }),
          AdminOrderProductIncompleteModel.insertMany(
            allProducts.map((i) => ({
              ...i,
              orderId: MONGOOSE_ID,
              visitorId: req.body.visitorId,
            })),
            { session }
          )
        ];

        const [orderData] = await Promise.all(promiseArr);
        if (!orderData) {
          return res.status(400).json({
            data: null,
            success: false,
            message: "Failed to create order!",
          });
        }

        res.status(201).json({
          data: orderData,
          success: true,
          message: "Create order successfully.",
        });

        await session.commitTransaction();
        return {};
      });
    } catch (err) {
        console.log("*** adminCustomerOrderController: createAdminCustomerOrder ***");
        console.log("ERROR:", err);
        try {
          if (session && session.inTransaction && session.inTransaction()) {
            await session.abortTransaction();
          }
        } catch (abortErr) {
          // Transaction already aborted or not started
          console.log("Transaction abort error (ignored):", abortErr.message);
        }
      return res.status(500).json({
        data: null,
        success: false,
        message: "Internal Server Error Occurred.",
      });
    } finally {
      // Only end session if it exists (transactions might be disabled)
      if (session) {
        try {
          session.endSession();
        } catch (sessionErr) {
          console.log("Session end error (ignored):", sessionErr.message);
        }
      }
    }
  };

  // FETCH ALL CUSTOMER ORDERS
  const fetchAllAdminCustomerOrder = async (req, res) => {
    try {
      const page = Math.max(1, req.query.page) || 1;
      const pageLimit = Math.max(1, req.query.limit) || 1;

      const [orderData, totalData] = await Promise.all([
        OrderModel.aggregate([
          {
            $match: {
              customerId: ObjectId(req.user._id),
              resellerId: null,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          ...adminOrderPopulate,
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
      console.log("*** adminCustomerOrderController: fetchAllCustomerOrder ***");
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
      console.log('req.user ================', req.user)
      const [orderData] = await OrderModel.aggregate([
        {
          $match: {
            resellerId: null,
            serialId: { $eq: req.params.serialId },
          },
        },
        ...adminOrderPopulate,
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
      console.log("*** adminCustomerOrderController: fetchSingleOrder ***");
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
          "resellerInfo.resellerId": null,
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
    orderOtpSend,
    orderOtpVerify,
    createAdminCustomerOrder,
    createAdminCustomerOrderBkash,
    createAdminCustomerOrderBkashCallback,
    createAdminCustomerIncompleteOrder,
    fetchAllAdminCustomerOrder,
    fetchSingleOrder,
    fetchVisitorOrders,
  };
