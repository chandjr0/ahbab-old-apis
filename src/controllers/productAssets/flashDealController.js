const FlashDealModel = require("../../models/product/flashDealProduct");
// const SettingModel = require("../../models/settings/setting");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
const productQuery = require("../../helpers/productQuery");

// CREATE/UPDATE FLASH DEAL PRODUCT
const updateFlashDealProduct = async (req, res) => {
  try {
    const allProductIds = req.body.flashDealProducts.map((i) => i?.productId);

    const flashObj = {
      products: allProductIds,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    };
    const flashDealData = await FlashDealModel.findOneAndUpdate(
      {},
      { $set: flashObj },
      { new: true, upsert: true }
    );

    if (!flashDealData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not update flash-deal!",
      });
    }

    await Promise.all(
      req.body.flashDealProducts.map(async (data) => {
        if (data?.isVariant) {
          await Promise.all(
            data?.variations.map(async (variant) => {
              await VariationModel.findOneAndUpdate(
                {
                  _id: variant?.variationId,
                },
                {
                  $set: {
                    flashPrice: variant?.flashPrice,
                  },
                },
                { new: true, upsert: true }
              );
            })
          );
        } else {
          await ProductModel.findOneAndUpdate(
            {
              _id: data?.productId,
            },
            {
              $set: {
                "nonVariation.flashPrice": data?.flashPrice,
              },
            },
            { new: true }
          );
        }
      })
    );

    if (new Date(req.body.startTime) <= new Date() && new Date(req.body.endTime) >= new Date()) {
      await ProductModel.updateMany(
        {
          _id: { $in: allProductIds },
        },
        {
          $set: {
            isFlashDeal: true,
          },
        },
        { new: true }
      );
    } else {
      await ProductModel.updateMany(
        {
          _id: { $in: allProductIds },
        },
        {
          $set: {
            isFlashDeal: false,
          },
        },
        { new: true }
      );
    }

    return res.status(200).json({
      data: flashDealData,
      message: "Flash-Deal update successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** flashDealController: updateFlashDealProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//  REMOVE PRODUCT FORM FLASHDEAL
const removeProductFromFlashDeal = async (req, res) => {
  try {
    await Promise.all([
      await ProductModel.findOneAndUpdate(
        { _id: req.params.productId },
        {
          $set: {
            "nonVariation.flashPrice": 0,
            isFlashDeal: false,
          },
        },
        {
          new: true,
        }
      ),
      await VariationModel.updateMany(
        {
          productId: { $in: req.params.productId },
        },
        {
          $set: {
            flashPrice: 0,
          },
        },
        {
          new: true,
        }
      ),
    ]);

    const flashDealData = await FlashDealModel.findOneAndUpdate(
      {},
      {
        $pull: {
          products: req.params.productId,
        },
      },
      {
        new: true,
      }
    );

    if (!flashDealData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not delete product from flash-deal!",
      });
    }

    return res.status(200).json({
      data: null,
      message: "Remove product successfully",
      success: true,
    });
  } catch (err) {
    console.log("*** flashDealController: removeProductFromFlashDeal ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH FLASH DEAL PRODUCT
const fetchFlashDealProducts = async (req, res) => {
  try {
    const flashDealData = await FlashDealModel.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "products",
          foreignField: "_id",
          pipeline: [
            ...productQuery.category(),
            ...productQuery.brand(),
            ...productQuery.sticker(),
            ...productQuery.variations(),
          ],
          as: "products",
        },
      },
    ]);

    if (!flashDealData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not create flash-deal!",
      });
    }

    return res.status(201).json({
      data: flashDealData[0],
      message: "Flash-Deal update successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** flashDealController: updateFlashDealProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// CHECK FLASH DEAL VALIDITY
const checkFlashDeal = async (req, res) => {
  try {
    const flashDealData = await FlashDealModel.findOne({});

    if (!flashDealData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not flash-deal!",
      });
    }

    if (
      new Date(flashDealData.startTime) <= new Date() &&
      new Date(flashDealData.endTime) >= new Date()
    ) {
      await ProductModel.updateMany(
        {
          _id: { $in: flashDealData?.products },
        },
        {
          $set: {
            isFlashDeal: true,
          },
        },
        { new: true }
      );
    } else {
      await ProductModel.updateMany(
        {
          _id: { $in: flashDealData?.products },
        },
        {
          $set: {
            isFlashDeal: false,
          },
        },
        { new: true }
      );
    }

    return res.status(200).json({
      data: null,
      message: "Check successfully",
      success: true,
    });
  } catch (err) {
    console.log("*** flashDealController: checkFlashDeal ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const test = async (req, res) => {
  try {
    const flashData = await FlashDealModel.find({
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() },
    });

    return res.status(200).json({
      data: flashData,
      message: "Check successfully",
      success: true,
    });
  } catch (err) {
    console.log("*** flashDealController: updateFlashDealProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  updateFlashDealProduct,
  removeProductFromFlashDeal,
  fetchFlashDealProducts,
  checkFlashDeal,
  test,
};
