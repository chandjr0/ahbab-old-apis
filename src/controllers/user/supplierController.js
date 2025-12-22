const slug = require("slug");

const SupplierModel = require("../../models/user/supplier");
const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");

const createSupplier = async (req, res) => {
  try {
    req.body.slug = slug(req.body.name);
    if (req.body.image !== "") {
      req.body.image = uploadImage(req.body.image, "public/supplier/");
    }

    const supplierData = await SupplierModel.create(req.body);

    if (!supplierData) {
      return res.status(400).json({ data: null, message: "Could not be created!", success: false });
    }

    return res.status(201).json({
      data: supplierData,
      message: "Created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** supplierController: createSupplier ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const checkSupplier = await SupplierModel.findOne({
      _id: req.params.supplierId,
    });

    if (!checkSupplier) {
      return res.status(409).json({
        data: null,
        message: "Couldn't found!",
        success: false,
      });
    }

    if (req.body.image) {
      const isNewImage = req.body.image.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.image = uploadImage(req.body.image, "public/supplier/");
        if (checkSupplier.image) {
          deleteFile(checkSupplier.image);
        }
      }
    } else if (!req.body.image && checkSupplier?.image) {
      req.body.image = "";
      deleteFile(checkSupplier?.image);
    }

    const brandData = await SupplierModel.findOneAndUpdate(
      { _id: req.params.supplierId },
      { $set: req.body },
      { new: true }
    );

    if (!brandData) {
      return res.status(400).json({
        message: "Could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: brandData,
      message: "Updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** supplierController: updateSupplier ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// conditional delete ***
const deleteSupplier = async (req, res) => {
  try {
    // const isExistInProduct = await ProductModel.findOne({
    //   brand: req.params.supplierId,
    // });

    // if (isExistInProduct) {
    //   return res.status(409).json({
    //     data: null,
    //     message: "Brand couldn't delete. Already use in product!",
    //     success: false,
    //   });
    // }

    const checkSupplier = await SupplierModel.findOne({
      _id: req.params.supplierId,
    });

    if (!checkSupplier) {
      return res.status(409).json({
        data: null,
        message: "Couldn't found!",
        success: false,
      });
    }

    if (checkSupplier.image) {
      deleteFile(checkSupplier.image);
    }

    const supplierData = await SupplierModel.findOneAndDelete({
      _id: req.params.supplierId,
    });

    if (!supplierData) {
      return res.status(400).json({
        data: null,
        message: "Couldn't deleted!",
        success: false,
      });
    }

    return res.status(200).json({
      data: supplierData,
      message: "Deleted successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** supplierController: deleteSupplier ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSuppliers = async (req, res) => {
  try {
    const supplierData = await SupplierModel.find({}).sort({ createdAt: -1 });

    if (!supplierData) {
      return res.status(400).json({
        message: "Couldn't fetch brands!",
        success: false,
      });
    }

    return res.status(200).json({
      data: supplierData,
      message: "Fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** supplierController: fetchSuppliers ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleSupplier = async (req, res) => {
  try {
    const supplierData = await SupplierModel.findOne({
      _id: req.params.supplierId,
    });

    if (!supplierData) {
      return res.status(400).json({
        message: "Couldn't fetch!",
        success: false,
      });
    }

    return res.status(200).json({
      data: supplierData,
      message: "Fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** supplierController: fetchSingleSupplier ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchSuppliers,
  fetchSingleSupplier,
};
