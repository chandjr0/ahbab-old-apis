const StickerModel = require("../../models/product/sticker");
const ProductModel = require("../../models/product/product");

const stickerCreate = async (req, res) => {
  try {
    const checkName = await StickerModel.findOne({
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    }).lean();

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Sticker name already exist!",
      });
    }

    const data = await StickerModel.create(req.body);

    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be created!",
      });
    }

    return res.status(201).json({
      data,
      success: true,
      message: "Created Successfully!",
    });
  } catch (err) {
    console.log("*** stickerController: stickerCreate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const stickerUpdate = async (req, res) => {
  try {
    const checkName = await StickerModel.findOne({
      _id: { $ne: req.params.stickerId },
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    });

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Sticker name already exist!",
      });
    }

    const data = await StickerModel.findOneAndUpdate(
      { _id: req.params.stickerId },
      { $set: req.body },
      { new: true }
    );

    if (!data) {
      res.status(400).json({
        data: null,
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data,
      success: true,
      message: "Updated Successfully!",
    });
  } catch (err) {
    console.log("*** stickerController: stickerUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const stickerViewAll = async (req, res) => {
  try {
    const data = await StickerModel.find({}).sort({ createdAt: -1 });

    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be viewed!",
      });
    }
    return res.status(200).json({
      data,
      success: true,
      message: "View all Successfully.",
    });
  } catch (err) {
    console.log("*** stickerController: stickerViewAll ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const stickerDelete = async (req, res) => {
  try {
    const data = await StickerModel.findOneAndRemove({ _id: req.params.stickerId });
    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be deleted!",
      });
    }

    await ProductModel.updateMany(
      { sticker: req.params.stickerId },
      { $unset: { stickerId: 1 } },
      { multi: true }
    );

    return res.status(200).json({
      data: null,
      success: true,
      message: "Deleted Successfully!",
    });
  } catch (err) {
    console.log("*** stickerController: stickerDelete ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  stickerCreate,
  stickerUpdate,
  stickerViewAll,
  stickerDelete,
};
