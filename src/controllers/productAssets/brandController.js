const slug = require("slug");

const BrandModel = require("../../models/product/brand");
const ProductModel = require("../../models/product/product");
const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");

const createBrand = async (req, res) => {
  try {
    const checkBrand = await BrandModel.findOne(
      {
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkBrand) {
      return res
        .status(409)
        .json({ data: null, message: "Brand name already exists!", success: false });
    }

    req.body.slug = slug(req.body.name);
    if (req.body.image !== "") {
      req.body.image = uploadImage(req.body.image, "public/brand/");
    }

    const brandData = await BrandModel.create(req.body);

    if (!brandData) {
      return res
        .status(400)
        .json({ data: null, message: "Brand could not be created!", success: false });
    }

    return res.status(201).json({
      data: brandData,
      message: "Brand created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: createBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const checkBrand = await BrandModel.findOne({
      _id: req.params.brandId,
    });

    if (!checkBrand) {
      return res.status(409).json({
        data: null,
        message: "Brand couldn't found!",
        success: false,
      });
    }

    const checkBrandName = await BrandModel.findOne(
      {
        _id: { $ne: req.params.brandId },
        name: { $regex: `^${req.body.name}$`, $options: "i" },
      },
      { name: 1 }
    );

    if (checkBrandName) {
      return res.status(409).json({
        data: null,
        message: "Brand name already exists!",
        success: false,
      });
    }

    req.body.slug = slug(req.body.name);

    if (req.body.image) {
      const isNewImage = req.body.image.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.image = uploadImage(req.body.image, "public/brand/");
        if (checkBrand.image) {
          deleteFile(checkBrand.image);
        }
      }
    } else if (!req.body.image && checkBrand?.image) {
      req.body.image = "";
      deleteFile(checkBrand?.image);
    }

    const brandData = await BrandModel.findOneAndUpdate(
      { _id: req.params.brandId },
      { $set: req.body },
      { new: true }
    );

    if (!brandData) {
      return res.status(400).json({
        message: "Brand could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: brandData,
      message: "Brand updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: updateBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const isExistInProduct = await ProductModel.findOne({
      brand: req.params.brandId,
    });

    if (isExistInProduct) {
      return res.status(409).json({
        data: null,
        message: "Brand couldn't delete. Already use in product!",
        success: false,
      });
    }

    const checkBrand = await BrandModel.findOne({
      _id: req.params.brandId,
    });

    if (!checkBrand) {
      return res.status(409).json({
        data: null,
        message: "Brand couldn't found!",
        success: false,
      });
    }

    if (checkBrand.image) {
      deleteFile(checkBrand.image);
    }

    const brandData = await BrandModel.findOneAndDelete({
      _id: req.params.brandId,
    });

    if (!brandData) {
      return res.status(400).json({
        data: null,
        message: "Brand couldn't deleted!",
        success: false,
      });
    }

    // await SubCategoryModel.updateMany(
    //   { brands: req.params.brandId },
    //   { $pull: { brands: req.params.brandId } }
    // );

    return res.status(200).json({
      data: null,
      message: "Brand deleted successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: deleteBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchALLBrand = async (req, res) => {
  try {
    const brandData = await BrandModel.find(
      {},
      {
        name: 1,
        slug: 1,
        image: 1,
        isFeatured: 1,
        isDisabled: 1,
      }
    ).sort({ createdAt: -1 });

    if (!brandData) {
      return res.status(400).json({
        message: "Couldn't fetch brands!",
        success: false,
      });
    }

    return res.status(200).json({
      data: brandData,
      message: "Brands fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: fetchALLBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleBrand = async (req, res) => {
  try {
    const brandData = await BrandModel.findOne(
      {
        _id: req.params.brandId,
      },
      {
        name: 1,
        slug: 1,
        image: 1,
        isFeatured: 1,
        isDisabled: 1,
      }
    );

    if (!brandData) {
      return res.status(400).json({
        message: "Couldn't fetch brand!",
        success: false,
      });
    }

    return res.status(200).json({
      data: brandData,
      message: "Brand fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: fetchSingleBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchALLFeaturedBrand = async (req, res) => {
  try {
    const brandData = await BrandModel.find(
      {
        isDisabled: false,
        isFeatured: true,
      },
      {
        name: 1,
        slug: 1,
        image: 1,
        isFeatured: 1,
      }
    );

    if (!brandData) {
      return res.status(400).json({
        message: "Couldn't fetch featured brands!",
        success: false,
      });
    }

    return res.status(200).json({
      data: brandData,
      message: "Featured brands fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** brandController: fetchALLFeaturedBrand ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createBrand,
  updateBrand,
  deleteBrand,
  fetchALLBrand,
  fetchSingleBrand,
  fetchALLFeaturedBrand,
};
