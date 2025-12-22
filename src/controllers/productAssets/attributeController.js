const mongoose = require("mongoose");
const AttributeModel = require("../../models/product/attributes");
const AttributeOptModel = require("../../models/product/attributesOpt");
const VariationModel = require("../../models/product/variation");
// const SubCategoryModel = require("../../models/product/subCategory");
const { ObjectId } = mongoose.Types;

const createAttribute = async (req, res) => {
  try {
    const checkAttributeName = await AttributeModel.findOne(
      {
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkAttributeName) {
      return res.status(409).json({
        message: "Attribute name already exists!",
        success: false,
      });
    }

    const attributeData = await AttributeModel.create(req.body);

    if (!attributeData) {
      return res.status(400).json({
        message: "Attribute could not be created!",
        success: false,
      });
    }

    return res.status(201).json({
      data: attributeData,
      message: "Attribute created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: createAttribute ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateAttributeName = async (req, res) => {
  try {
    const checkAttribute = await AttributeModel.findOne({
      _id: req.params.attributeId,
    });

    if (!checkAttribute) {
      return res.status(409).json({
        message: "Attribute not found!",
        success: false,
      });
    }

    const checkAttributeName = await AttributeModel.findOne(
      {
        _id: { $ne: req.params.attributeId },
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkAttributeName) {
      return res.status(409).json({
        message: "Attribute name already exists!",
        success: false,
      });
    }

    const attributeData = await AttributeModel.findOneAndUpdate(
      { _id: req.params.attributeId },
      { $set: req.body },
      { new: true }
    );

    if (!attributeData) {
      return res.status(400).json({
        message: "Attribute could not be updated!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeData,
      message: "Attribute updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: updateAttributeName ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deleteAttribute = async (req, res) => {
  try {
    const checkAttribute = await AttributeModel.findOne({
      _id: req.params.attributeId,
    });

    if (!checkAttribute) {
      return res.status(409).json({
        message: "Attribute not found!",
        success: false,
      });
    }

    const isExistInProduct = await VariationModel.findOne({
      attributeOpts: { $in: checkAttribute.options },
    });

    if (isExistInProduct) {
      return res.status(409).json({
        data: null,
        message: "Attribute couldn't be deleted. Already use in product!",
        success: false,
      });
    }

    const attributeData = await AttributeModel.findOneAndDelete({
      _id: req.params.attributeId,
    });

    if (!attributeData) {
      return res.status(400).json({
        data: null,
        message: "Attribute could not be deleted!",
        success: false,
      });
    }

    await AttributeOptModel.deleteMany({ attributeId: req.params.attributeId });
    // await SubCategoryModel.updateMany(
    //   { attributes: req.params.attributeId },
    //   {
    //     $pull: {
    //       attributes: req.params.attributeId,
    //     },
    //   }
    // );

    return res.status(200).json({
      data: attributeData,
      message: "Attribute deleted successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: deleteAttribute ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const addAttributeOption = async (req, res) => {
  try {
    const checkAttribute = await AttributeModel.findOne({
      _id: req.body.attributeId,
    });

    if (!checkAttribute) {
      return res.status(409).json({
        message: "Attribute not found!",
        success: false,
      });
    }

    const checkAttributeOptName = await AttributeOptModel.findOne(
      {
        attributeId: req.body.attributeId,
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkAttributeOptName) {
      return res.status(409).json({
        message: "Attribute option name already exists!",
        success: false,
      });
    }

    const attributeOptData = await AttributeOptModel.create(req.body);

    if (!attributeOptData) {
      return res.status(400).json({
        message: "Attribute option could not be created!",
        success: false,
      });
    }

    await AttributeModel.findOneAndUpdate(
      { _id: req.body.attributeId },
      { $push: { options: attributeOptData._id } },
      { new: true }
    );

    return res.status(201).json({
      data: attributeOptData,
      message: "Attribute option created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: addAttributeOption ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateAttributeOption = async (req, res) => {
  try {
    const checkAttributeOpt = await AttributeOptModel.findOne({
      _id: req.params.attributeOptId,
    });

    if (!checkAttributeOpt) {
      return res.status(409).json({
        message: "Attribute option not found!",
        success: false,
      });
    }

    const checkAttributeOptName = await AttributeOptModel.findOne(
      {
        attributeId: checkAttributeOpt.attributeId,
        _id: { $ne: req.params.attributeOptId },
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkAttributeOptName) {
      return res.status(409).json({
        message: "Attribute option name already exists!",
        success: false,
      });
    }

    const attributeOptData = await AttributeOptModel.findOneAndUpdate(
      { _id: req.params.attributeOptId },
      { $set: req.body },
      { new: true }
    );

    if (!attributeOptData) {
      return res.status(400).json({
        message: "Attribute option could not be updated!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeOptData,
      message: "Attribute option updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: updateAttributeOption ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deleteAttributeOption = async (req, res) => {
  try {
    const checkAttributeOpt = await AttributeOptModel.findOne({
      _id: req.params.attributeOptId,
    });

    if (!checkAttributeOpt) {
      return res.status(409).json({
        message: "Attribute option not found!",
        success: false,
      });
    }

    // check in product
    const isExistInProduct = await VariationModel.findOne({
      attributeOpts: req.params.attributeOptId,
    });

    if (isExistInProduct) {
      return res.status(409).json({
        data: null,
        message: "Attribute option couldn't be deleted. Already use in product!",
        success: false,
      });
    }

    const attributeOptData = await AttributeOptModel.findOneAndDelete({
      _id: req.params.attributeOptId,
    });

    if (!attributeOptData) {
      return res.status(400).json({
        message: "Attribute option could not be deleted!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeOptData,
      message: "Attribute option deleted successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: deleteAttributeOption ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleAttributeOpt = async (req, res) => {
  try {
    const attributeOptData = await AttributeOptModel.findOne(
      {
        _id: req.params.attributeOptId,
      },
      { name: 1 }
    );

    if (!attributeOptData) {
      return res.status(400).json({
        message: "Attribute option could not be fetch!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeOptData,
      message: "Attribute option fetched successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: fetchSingleAttributeOpt ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchAllAttributes = async (req, res) => {
  try {
    const attributeData = await AttributeModel.aggregate([
      {
        $lookup: {
          from: "attribute_opts",
          localField: "options",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: "options",
        },
      },
      {
        $project: {
          name: 1,
          options: 1,
          isDisabled: 1,
        },
      },
    ]);

    if (!attributeData) {
      return res.status(400).json({
        message: "Couldn't fetch attributes!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeData,
      message: "Attributes fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: fetchAllAttributes ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleAttribute = async (req, res) => {
  try {
    const attributeData = await AttributeModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.attributeId),
        },
      },
      {
        $lookup: {
          from: "attribute_opts",
          localField: "options",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: "options",
        },
      },
      {
        $project: {
          name: 1,
          options: 1,
          isDisabled: 1,
        },
      },
    ]);

    if (!attributeData) {
      return res.status(400).json({
        message: "Couldn't fetch attributes!",
        success: false,
      });
    }

    return res.status(200).json({
      data: attributeData[0],
      message: "Attributes fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** attributeController: fetchSingleAttribute ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createAttribute,
  updateAttributeName,
  deleteAttribute,

  addAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
  fetchSingleAttributeOpt,

  fetchAllAttributes,
  fetchSingleAttribute,
};
