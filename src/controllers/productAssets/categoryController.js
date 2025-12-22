const mongoose = require("mongoose");
const slug = require("slug");
const CategoryModel = require("../../models/product/category");
const ProductModel = require("../../models/product/product");

const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");

const { nestedCategories } = require("../../helpers/productAssists");

const createCategory = async (req, res) => {
  try {
    const checkCategory = await CategoryModel.findOne(
      {
        name: req.body.name.toLowerCase(),
      },
      { name: 1 }
    );

    if (checkCategory) {
      return res.status(409).json({
        message: "Category name already exists!",
        success: false,
      });
    }

    req.body.name = req.body.name.toLowerCase();
    req.body.slug = slug(req.body.name);

    if (req.body.image !== "") {
      req.body.image = uploadImage(req.body.image, "public/category/");
    }
    if (req.body.imageForCategoryProduct !== "") {
      req.body.imageForCategoryProduct = uploadImage(req.body.imageForCategoryProduct, "public/category/");
    }
    if (req.body.imageForHomePage !== "") {
      req.body.imageForHomePage = uploadImage(req.body.imageForHomePage, "public/category/");
    }

    if (req.body.parentId === "") {
      delete req.body.parentId;
    }
    if (req.body.subParentId === "") {
      delete req.body.subParentId;
    }

    const categoryData = await CategoryModel.create(req.body);

    if (!categoryData) {
      return res.status(400).json({
        message: "Category could not be created!",
        success: false,
      });
    }

    return res.status(201).json({
      data: categoryData,
      message: "Category created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: createCategory ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const checkCategory = await CategoryModel.findOne({
      _id: req.params.categoryId,
    });

    if (!checkCategory) {
      return res.status(409).json({
        data: null,
        message: "Category couldn't found!",
        success: false,
      });
    }

    const checkCategoryName = await CategoryModel.findOne(
      {
        _id: { $ne: req.params.categoryId },
        name: req.body.name.toLowerCase(),
      },
      { name: 1 }
    );

    if (checkCategoryName) {
      return res.status(409).json({
        data: null,
        message: "Category name already exists!",
        success: false,
      });
    }

    req.body.name = req.body.name.toLowerCase();
    req.body.slug = slug(req.body.name);

    if (req.body.image) {
      const isNewImage = req.body.image.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.image = uploadImage(req.body.image, "public/category/");
        if (checkCategory.image) {
          deleteFile(checkCategory.image);
        }
      }
    }
    if (req.body.imageForCategoryProduct) {
      const isNewImage = req.body.imageForCategoryProduct.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.imageForCategoryProduct = uploadImage(req.body.imageForCategoryProduct, "public/category/");
        if (checkCategory.image) {
          deleteFile(checkCategory.image);
        }
      }
    }
    if (req.body.imageForHomePage) {
      const isNewImage = req.body.imageForHomePage.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.imageForHomePage = uploadImage(req.body.imageForHomePage, "public/category/");
        if (checkCategory.image) {
          deleteFile(checkCategory.image);
        }
      }
    }

    if (req.body.parentId === "") {
      req.body.parentId = null;
    }
    if (req.body.subParentId === "") {
      req.body.subParentId = null;
    }
    
    const categoryData = await CategoryModel.findOneAndUpdate(
      { _id: req.params.categoryId },
      { $set: req.body },
      { new: true }
    );

    if (!categoryData) {
      return res.status(400).json({
        message: "Category could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: categoryData,
      message: "Category updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: updateCategory ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deleteCategory = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const [checkCategory, haveSubCategory, haveSubSubCategory] = await Promise.all([
        CategoryModel.findOne({
          _id: req.params.categoryId,
        }),
        CategoryModel.findOne({
          parentId: req.params.categoryId,
        }),
        CategoryModel.findOne({
          subParentId: req.params.categoryId,
        }),
      ]);

      if (!checkCategory) {
        return res.status(409).json({
          data: null,
          message: "Category couldn't found!",
          success: false,
        });
      }

      if (haveSubCategory) {
        return res.status(409).json({
          data: null,
          message: "Failed, This Category have some sub-categories!",
          success: false,
        });
      }

      if (haveSubSubCategory) {
        return res.status(409).json({
          data: null,
          message: "Failed, This Category have some sub-sub-categories!",
          success: false,
        });
      }

      if (checkCategory.image) {
        deleteFile(checkCategory.image);
      }

      const categoryData = await CategoryModel.findOneAndDelete(
        { _id: req.params.categoryId },
        {
          session,
        }
      );

      // delete(pull) category from product
      await Promise.all([
        ProductModel.updateMany(
          {
            categories: req.params.categoryId,
          },
          {
            $pull: {
              categories: req.params.categoryId,
            },
          },
          {
            multi: true,
            session,
          }
        ),
        ProductModel.updateMany(
          {
            "resellerDetails.categoryId": req.params.categoryId,
          },
          {
            $set: {
              "resellerDetails.categoryId": null,
            },
          },
          {
            multi: true,
            session,
          }
        ),
      ]);

      return res.status(200).json({
        data: categoryData,
        message: "Category deleted successfully.",
        success: true,
      });
    });
  } catch (err) {
    console.log("*** categoryController: deleteCategory ***");
    console.log(err);
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

const fetchAllCategory = async (req, res) => {
  try {
    const categoryData = await CategoryModel.find({});

    if (categoryData <= 0) {
      return res.status(200).json({
        data: [],
        message: "Category not available!",
        success: false,
      });
    }
    const categoryDetails = nestedCategories(categoryData);

    return res.status(200).json({
      data: categoryDetails,
      message: "Categories fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: fetchAllCategory ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleCategory = async (req, res) => {
  try {
    const categoryData = await CategoryModel.findOne({ _id: req.params.categoryId });

    if (!categoryData) {
      return res.status(400).json({
        message: "Couldn't fetch category!",
        success: false,
      });
    }

    return res.status(200).json({
      data: categoryData,
      message: "Category fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: fetchSingleCategory ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchCategoryCommissionDetails = async (req, res) => {
  try {
    const [categoryData, childCategoryData, appliedChildCategoryData] = await Promise.all([
      CategoryModel.findOne({
        _id: req.params.categoryId,
      }).lean(),
      CategoryModel.find(
        {
          parentId: req.params.categoryId,
        },
        {
          name: 1,
          slug: 1,
        }
      ).lean(),
      CategoryModel.find(
        {
          parentId: req.params.categoryId,
          "resellerDetails.categoryId": req.params.categoryId,
        },
        {
          name: 1,
          slug: 1,
        }
      ).lean(),
    ]);

    const allCatIds = childCategoryData.map((i) => i?._id);
    allCatIds.push(categoryData?._id);

    const [totalChildProduct, applyTotalChildProduct] = await Promise.all([
      ProductModel.countDocuments({
        categories: { $in: allCatIds },
      }),
      ProductModel.countDocuments({
        "resellerDetails.categoryId": req.params.categoryId,
      }),
    ]);

    return res.status(200).json({
      data: {
        categoryData,
        appliedChildCategoryData,
        totalChildProduct,
        applyTotalChildProduct,
      },
      message: "Add commission to all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: fetchCategoryCommissionDetails ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const addCategoryProductCommissions = async (req, res) => {
  try {
    const categoryData = await CategoryModel.find({
      $or: [
        {
          _id: req.body.categoryId,
        },
        {
          parentId: req.body.categoryId,
        },
      ],
    });

    const allCatIds = categoryData.map((i) => i?._id);

    await Promise.all([
      ProductModel.updateMany(
        {
          categories: { $in: allCatIds },
        },
        {
          $set: {
            isReseller: true,
            resellerDetails: {
              categoryId: req.body.categoryId,
              isCommissionOn: true,
              commission: req.body.commission,
            },
          },
        },
        {
          multi: true,
        }
      ),
      CategoryModel.updateMany(
        {
          _id: { $in: allCatIds },
        },
        {
          $set: {
            resellerDetails: {
              categoryId: req.body.categoryId,
              isCommissionOn: true,
              commission: req.body.commission,
            },
          },
        },
        {
          multi: true,
        }
      ),
    ]);

    return res.status(200).json({
      data: null,
      message: "Add commission to all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: addCategoryProductCommissions ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const removeCategoryProductCommissions = async (req, res) => {
  try {
    await Promise.all([
      ProductModel.updateMany(
        {
          "resellerDetails.categoryId": req.params.categoryId,
        },
        {
          $set: {
            isReseller: false,
            resellerDetails: {
              categoryId: null,
              isCommissionOn: false,
              commission: 0,
            },
          },
        },
        {
          multi: true,
        }
      ),
      CategoryModel.updateMany(
        {
          "resellerDetails.categoryId": req.params.categoryId,
        },
        {
          $set: {
            resellerDetails: {
              categoryId: null,
              isCommissionOn: false,
              commission: 0,
            },
          },
        },
        {
          multi: true,
        }
      ),
    ]);

    return res.status(200).json({
      data: null,
      message: "Remove commission to all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** categoryController: removeCategoryProductCommissions ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const categorySearch = async (req, res) => {
  try {
    const { value } = req.body;
    const dbQuery = { $or: [
      { name: {$regex: value, $options: "i" }}, { slug: {$regex: value, $options: "i" }}
    ]};
    const categories = await CategoryModel.find(dbQuery);

    return res.status(200).json({
      data: categories, success: true,
      message: categories.length ? "View successfully" : 'No categories found!',
    });
  } catch (err) {
    console.log("*** categoryController: categorySearch ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  fetchSingleCategory,

  fetchAllCategory,

  fetchCategoryCommissionDetails,
  addCategoryProductCommissions,
  removeCategoryProductCommissions,

  categorySearch
};
