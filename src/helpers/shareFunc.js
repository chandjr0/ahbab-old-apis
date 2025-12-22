const { customAlphabet } = require("nanoid");
const OrderModel = require("../models/order/order");
// const AdminOrderModel = require("../models/adminOrder/adminOrder");
// const ResellerOrderModel = require("../models/resellerOrder/resellerOrder");
const ResellerPaymentModel = require("../models/resellerPayment/resellerPayment");
const ProductModel = require("../models/product/product");
const ComboModel = require("../models/comboProduct/combo");

const validateEmail = (email) =>
  String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

// delete
const orderSerialNumber = async () => {
  const totalOrder = (await OrderModel.countDocuments({})) || 0;

  let getSerialId = "0000001";
  getSerialId = `${totalOrder + 1}`;
  while (getSerialId.length < 7) {
    getSerialId = `0${getSerialId}`;
  }

  const customId = customAlphabet("ABCDEFGHIJKLMNPQRSTUVWXYZ", 10);
  const serialId = `${customId(4)}_${getSerialId}`;

  return serialId;
};

const adminOrderSerialNumber = async (totalOrder) => {
  // const totalOrder = (await AdminOrderModel.countDocuments({})) || 0;

  let getSerialId = "0000001";
  getSerialId = `${totalOrder + 1}`;
  while (getSerialId.length < 7) {
    getSerialId = `0${getSerialId}`;
  }

  const customId = customAlphabet("ABCDEFGHIJKLMNPQRSTUVWXYZ", 10);
  const serialId = `AHBAB_${getSerialId}`;

  return serialId;
};

const resellerOrderSerialNumber = async (totalOrder) => {
  let getSerialId = "0000001";
  getSerialId = `${totalOrder + 1}`;
  while (getSerialId.length < 7) {
    getSerialId = `0${getSerialId}`;
  }

  const customId = customAlphabet("ABCDEFGHIJKLMNPQRSTUVWXYZ", 10);
  const serialId = `FMR_${customId(4)}_${getSerialId}`;

  return serialId;
};

const getResellerPaymentSerial = async () => {
  const totalOrder = (await ResellerPaymentModel.countDocuments({})) || 0;

  let getSerialId = "0000001";
  getSerialId = `${totalOrder + 1}`;
  while (getSerialId.length < 7) {
    getSerialId = `0${getSerialId}`;
  }

  const customId = customAlphabet("ABCDEFGHIJKLMNPQRSTUVWXYZ", 10);
  const serialId = `Pay_${customId(4)}_${getSerialId}`;

  return serialId;
};

const getCustomerCharge = ({ totalProductPrice, discountPrice, deliveryCharge, totalPayTk }) => {
  const afterDiscountTotalPrice = Number(totalProductPrice) - Number(discountPrice) || 0;
  const totalBill = Number(afterDiscountTotalPrice) + Number(deliveryCharge) || 0;

  const obj = {
    totalProductPrice,
    discountPrice,
    deliveryCharge,
    totalPayTk,
    afterDiscountTotalPrice,
    totalBill,
    remainingTkPay: totalBill - totalPayTk,
  };

  return obj;
};

const getCustomerChargeForOnlinePayment = ({ totalProductPrice, discountPrice, deliveryCharge, totalPayTk }) => {
  const afterDiscountTotalPrice = Number(totalProductPrice) - Number(discountPrice) || 0;
  const totalBill = Number(afterDiscountTotalPrice) + Number(deliveryCharge) || 0;

  const obj = {
    totalProductPrice,
    discountPrice,
    deliveryCharge,
    totalPayTk: totalBill,
    afterDiscountTotalPrice,
    totalBill,
    remainingTkPay: 0,
  };

  return obj;
};

const productSku = async () => {
  const lastProduct =
    (await ProductModel.findOne({}, { sku: 1 }).sort({ createdAt: -1 }))?.sku ?? "0";

  // NEW_CODE
  let lastProductSerial;
  if (lastProduct !== "0") {
    lastProductSerial = Number(lastProduct.split("BS")[1]);
  } else {
    lastProductSerial = 0;
  }

  let getSerialId;
  if (lastProductSerial < 1000) {
    getSerialId = String(lastProductSerial + 1);
    while (getSerialId.length < 4) getSerialId = `0${getSerialId}`;
    getSerialId = `BS${getSerialId}`;
  } else {
    getSerialId = `BS${lastProductSerial + 1}`;
  }

  return getSerialId;
};

const comboSku = async () => {
  // const lastProduct = (await ComboModel.findOne({}, { sku: 1 }).sort({ createdAt: -1 }))?.sku;

  // let getSerialId = "0000001";
  // getSerialId = `${Number(lastProduct) + 1}`;
  // while (getSerialId.length < 7) {
  //   getSerialId = `0${getSerialId}`;
  // }

  // return getSerialId;

  const lastProduct =
    (await ComboModel.findOne({}, { sku: 1 }).sort({ createdAt: -1 }))?.sku ?? "0";

  // NEW_CODE
  let lastProductSerial;
  if (lastProduct !== "0") {
    lastProductSerial = Number(lastProduct.split("BSC")[1]);
  } else {
    lastProductSerial = 0;
  }

  let getSerialId;
  if (lastProductSerial < 1000) {
    getSerialId = String(lastProductSerial + 1);
    while (getSerialId.length < 4) getSerialId = `0${getSerialId}`;
    getSerialId = `BSC${getSerialId}`;
  } else {
    getSerialId = `BSC${lastProductSerial + 1}`;
  }

  return getSerialId;
};

const getPriceAfterDiscount = (originalPrice, discountType, discountAmount) => {
  if (discountType === "FLAT") {
    return Number(originalPrice) - Number(discountAmount);
  }
  return Math.ceil(Number(originalPrice) - (Number(originalPrice) * Number(discountAmount)) / 100);
};

module.exports = {
  validateEmail,
  orderSerialNumber,
  adminOrderSerialNumber,
  resellerOrderSerialNumber,
  getResellerPaymentSerial,
  getCustomerCharge,
  getCustomerChargeForOnlinePayment,
  productSku,
  comboSku,
  getPriceAfterDiscount,
};
