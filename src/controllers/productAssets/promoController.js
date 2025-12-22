const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;
const PromoModel = require("../../models/product/promo");
const ProductModel = require("../../models/product/product");
const ComboModel = require("../../models/comboProduct/combo");
const CategoryModel = require("../../models/product/category");
const customMetaData = require("../../helpers/customMetaData");
const { promoAggregate } = require("../../helpers/promoQuery");

const createPromo = async (req, res) => {
  try {
    const [checkPromo, checkProduct, checkCombo, checkCategory] = await Promise.all([
      PromoModel.findOne({ promo: { $regex: `^${req.body.promo}$`, $options: "i" } }),
      ProductModel.find({ _id: { $in: req.body.productIds } }, { _id: 1 }),
      ComboModel.find({ _id: { $in: req.body.comboIds } }, { _id: 1 }),
      CategoryModel.find({ _id: { $in: req.body.categoryIds } }, { _id: 1 }),
    ]);

    if (checkPromo) {
      return res.status(409).json({
        data: null,
        message: "Promo code already use!",
        success: false,
      });
    }

    if (
      req.body.promoType === "product" &&
      req.body.productIds.length <= 0 &&
      req.body.productIds.length !== checkProduct.length
    ) {
      return res.status(409).json({
        data: null,
        message: "There is some invalid products!",
        success: false,
      });
    }

    if (
      req.body.promoType === "combo" &&
      req.body.comboIds.length <= 0 &&
      req.body.comboIds.length !== checkCombo.length
    ) {
      return res.status(409).json({
        data: null,
        message: "There is some invalid combo!",
        success: false,
      });
    }

    if (
      req.body.promoType === "category" &&
      req.body.categoryIds.length <= 0 &&
      req.body.categoryIds.length !== checkCategory.length
    ) {
      return res.status(409).json({
        data: null,
        message: "There is some invalid category!",
        success: false,
      });
    }

    if (req.body.promoType === "phone" && req.body.phones.length <= 0) {
      return res.status(409).json({
        data: null,
        message: "There is no phone added!",
        success: false,
      });
    }

    if (req.body.promoType === "free_delivery") {
      req.body.discount = {
        discountType: "",
        discountPrice: 0,
      };
    }

    const a = new Date(req.body.startTime);
    const b = new Date(req.body.endTime);

    const obj = {
      promo: req.body.promo,
      promoType: req.body.promoType,
      productIds: req.body.promoType === "product" ? req.body.productIds : [],
      comboIds: req.body.promoType === "combo" ? req.body.comboIds : [],
      categoryIds: req.body.promoType === "category" ? req.body.categoryIds : [],
      phones: req.body.promoType === "phone" ? req.body.phones : [],
      minBuyingAmount: req.body.minBuyingAmount,
      discount: req.body.discount,
      startTime: Math.min(a, b),
      endTime: Math.max(a, b),
      limitInfo: req.body.limitInfo,
      userLimitInfo: req.body.userLimitInfo,
      isDisable: req.body.isDisable,
    };

    const data = await PromoModel.create(obj);

    return res.status(201).json({
      data,
      message: "Promo created successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** promoController: createPromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updatePromo = async (req, res) => {
  try {
    const checkPromo = await PromoModel.findOne({ _id: req.params.promoId });

    if (!checkPromo) {
      return res.status(409).json({
        data: null,
        message: "Promo not found!",
        success: false,
      });
    }

    const a = new Date(req.body.startTime);
    const b = new Date(req.body.endTime);

    const obj = {
      minBuyingAmount: req.body.minBuyingAmount,
      discount: req.body.discount,
      startTime: Math.min(a, b),
      endTime: Math.max(a, b),
      "limitInfo.haveLimit": req.body.limitInfo.haveLimit,
      "limitInfo.maxUsed": req.body.limitInfo.maxUsed,
      "userLimitInfo.haveLimit": req.body.userLimitInfo.haveLimit,
      "userLimitInfo.maxUsed": req.body.userLimitInfo.maxUsed,
      isDisable: req.body.isDisable,
    };

    const promoData = await PromoModel.findOneAndUpdate(
      { _id: req.params.promoId },
      {
        $set: obj,
      },
      {
        new: true,
      }
    );

    if (!promoData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update promo code!",
        success: false,
      });
    }

    return res.status(200).json({
      data: promoData,
      message: "Promo updated successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** promoController: updatePromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const promoEnableDisable = async (req, res) => {
  try {
    const promoData = await PromoModel.findOneAndUpdate(
      { _id: req.params.promoId },
      { isDisable: req.query.isDisable },
      {
        new: true,
      }
    );

    if (!promoData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update promo code!",
        success: false,
      });
    }

    return res.status(200).json({
      data: promoData,
      message: "Promo updated successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** promoController: promoEnableDisable ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchAllPromo = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};

    if (req.query.promoType !== "all") {
      matchCondition = {
        promoType: req.query.promoType,
      };
    }

    const [promoData, totalData] = await Promise.all([
      PromoModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...promoAggregate,
      ]),
      PromoModel.countDocuments(matchCondition),
    ]);

    if (!promoData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Promo could not be found!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: promoData,
      success: true,
      message: "fetch all promo!",
    });
  } catch (err) {
    console.log("*** promoController: fetchAllPromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchAllPromoByReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [promoData, totalData] = await Promise.all([
      PromoModel.aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...promoAggregate,
      ]),
      PromoModel.countDocuments(),
    ]);

    if (!promoData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Promo could not be found!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: promoData,
      success: true,
      message: "fetch all promo!",
    });
  } catch (err) {
    console.log("*** promoController: fetchAllPromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSinglePromo = async (req, res) => {
  try {
    const [promoData] = await PromoModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.promoId),
        },
      },
      ...promoAggregate,
    ]);

    if (!promoData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Promo could not be found!",
      });
    }

    return res.status(200).json({
      data: promoData,
      success: true,
      message: "fetch promo!",
    });
  } catch (err) {
    console.log("*** promoController: fetchSinglePromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deletePromo = async (req, res) => {
  try {
    const promoData = await PromoModel.findOneAndDelete({ _id: req.params.promoId });

    if (!promoData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Promo could not be found!",
      });
    }

    return res.status(202).json({
      data: promoData,
      success: true,
      message: "Promo deleted successfully",
    });
  } catch (err) {
    console.log("*** promoController: deletePromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const discountCalc = ({ totalPrice, discount }) => {
  let totalDiscountPrice = 0;
  if (discount.discountType === "PERCENT") {
    totalDiscountPrice = Math.ceil((Number(totalPrice) * Number(discount.discountPrice)) / 100);
  } else {
    totalDiscountPrice = Number(discount.discountPrice);
  }
  return totalDiscountPrice;
};

const verifyPromo = async (req, res) => {
  try {
    if (req.body.products.length <= 0 && req.body.combos.length <= 0) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Must have one product or combo product to calculate the promo price!",
      });
    }

    const [promoData, checkAllProducts] = await Promise.all([
      PromoModel.findOne({
        promo: { $regex: `^${req.body.promo}$`, $options: "i" },
        isDisable: false,
      }),
      ProductModel.find(
        {
          _id: { $in: req.body.products.map((item) => ObjectId(item?.productId)) },
          isDeleted: false,
        },
        {
          categories: 1,
        }
      ),
    ]);

    if (!promoData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Inactive promo code!",
      });
    }

    if (!(promoData.startTime <= new Date() && promoData.endTime >= new Date())) {
      return res.status(409).json({
        data: 0,
        success: false,
        message: "Promo is not active right now!",
      });
    }

    if (
      promoData?.limitInfo?.haveLimit &&
      promoData?.limitInfo?.maxUsed <= promoData?.limitInfo?.totalUsed
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "The Promo code limit was exceeded!",
      });
    }

    const totalProductPrice =
      req.body.products.reduce((prev, cur) => prev + Number(cur.quantity) * Number(cur.price), 0) ||
      0;
    const totalComboPrice =
      req.body.combos.reduce((prev, cur) => prev + Number(cur.quantity) * Number(cur.price), 0) ||
      0;

    if (promoData.minBuyingAmount > totalProductPrice + totalComboPrice) {
      return res.status(409).json({
        data: 0,
        success: false,
        message: `Minimum product prices ${promoData.minBuyingAmount}TK!`,
      });
    }

    let errorMsg = "Invalid promo";
    if (promoData?.promoType === "regular") {
      const discount = discountCalc({
        totalPrice: totalProductPrice + totalComboPrice,
        discount: promoData?.discount,
      });
      return res.status(200).json({
        data: {
          promoType: promoData?.promoType,
          discount,
        },
        success: true,
        message: `You got ${discount}TK discount`,
      });
    }
    if (promoData?.promoType === "free_delivery") {
      return res.status(200).json({
        data: {
          promoType: promoData?.promoType,
          discount: 0,
        },
        success: true,
        message: "You got free delivery discount",
      });
    }
    if (promoData?.promoType === "product") {
      let totalPrice = 0;
      let isProdExist = false;

      req.body.products.forEach((product) => {
        if (promoData?.productIds.map((item) => String(item)).includes(String(product.productId))) {
          totalPrice += Number(product.quantity) * Number(product.price) || 0;
          isProdExist = true;
        }
      });

      if (!isProdExist) {
        return res.status(409).json({
          data: 0,
          success: false,
          message: "Invalid promo for your cart products!",
        });
      }

      const discount = discountCalc({
        totalPrice,
        discount: promoData?.discount,
      });
      return res.status(200).json({
        data: {
          promoType: promoData?.promoType,
          discount,
        },
        success: true,
        message: `You got ${discount}TK discount`,
      });
    }
    if (promoData?.promoType === "combo") {
      let totalPrice = 0;
      let isComboExist = false;

      req.body.combos.forEach((combo) => {
        if (promoData?.comboIds.map((item) => String(item)).includes(String(combo.comboId))) {
          totalPrice += Number(combo.quantity) * Number(combo.price) || 0;
          isComboExist = true;
        }
      });

      if (!isComboExist) {
        return res.status(409).json({
          data: 0,
          success: false,
          message: "Invalid promo for your cart combo products!",
        });
      }

      const discount = discountCalc({
        totalPrice,
        discount: promoData?.discount,
      });
      return res.status(200).json({
        data: {
          promoType: promoData?.promoType,
          discount,
        },
        success: true,
        message: `You got ${discount}TK discount`,
      });
    }
    if (promoData?.promoType === "category") {
      const strCategories = promoData.categoryIds.map((item) => String(item));
      const selectedIds = [];
      let isCategoryExist = false;
      checkAllProducts.forEach((checkProduct) => {
        if (
          checkProduct.categories.filter((catId) => strCategories.includes(String(catId))).length >
          0
        ) {
          selectedIds.push(checkProduct?._id);
          isCategoryExist = true;
        }
      });

      if (!isCategoryExist) {
        return res.status(409).json({
          data: 0,
          success: false,
          message: "Invalid promo for your cart products categories!",
        });
      }

      let totalPrice = 0;
      req.body.products.forEach((product) => {
        if (selectedIds.map((item) => String(item)).includes(String(product.productId))) {
          totalPrice += Number(product.quantity) * Number(product.price) || 0;
        }
      });

      const discount = discountCalc({
        totalPrice,
        discount: promoData?.discount,
      });
      return res.status(200).json({
        data: {
          promoType: promoData?.promoType,
          discount,
        },
        success: true,
        message: `You got ${discount}TK discount`,
      });
    }
    if (promoData?.promoType === "phone") {
      if (promoData.phones.includes(req.body.phone)) {
        const discount = discountCalc({
          totalPrice: totalProductPrice + totalComboPrice,
          discount: promoData?.discount,
        });
        return res.status(200).json({
          data: {
            promoType: promoData?.promoType,
            discount,
          },
          success: true,
          message: `You got ${discount}TK discount`,
        });
      }
      errorMsg = "Invalid promo for this phone number.";
    }

    return res.status(400).json({
      data: null,
      success: false,
      message: errorMsg,
    });
  } catch (err) {
    console.log("*** promoController: verifyPromo ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createPromo,
  updatePromo,
  promoEnableDisable,
  fetchAllPromo,
  fetchAllPromoByReseller,
  fetchSinglePromo,
  deletePromo,
  verifyPromo,
};
