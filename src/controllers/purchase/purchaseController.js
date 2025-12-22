// const { nanoid } = require("nanoid");
const { customAlphabet } = require("nanoid");

const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz123456789", 20);

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const PurchaseModel = require("../../models/purchase/purchase");
const PurchaseProductModel = require("../../models/purchase/purchaseProducts");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");

const deleteFile = require("../../utils/delete-file");
const uploadImage = require("../../utils/upload-img");
const pagination = require("../../helpers/paginationQuery");
// const createOrderInvoice = require("../../invoices/orderInvoice").createInvoiceSingle;

// CREATE PURCHASE
const createPurchase = async (req, res) => {
  try {
    if (req.body.document) {
      req.body.document = uploadImage(req.body.document, "public/invoice/");
    }

    const purchaseObj = {
      serialId: customNanoId(11),
      supplierId: req.body.supplierId,
      totalBill: req.body.totalBill,
      adminNote: [
        {
          message: req.body.adminNote,
          createdBy: req.user.role,
          time: new Date(),
        },
      ],
      createdBy: req.user.role,
      purchaseStatus: [
        {
          status: "PENDING",
          time: new Date(),
        },
      ],
      document: req.body.document,
    };

    if (req.body.adminNote === "") {
      delete purchaseObj.adminNote;
    }

    const purchaseData = await PurchaseModel.create(purchaseObj);

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to create purchase",
      });
    }

    const purchaseProducts = req.body.products.map((data) => ({
      ...data,
      purchaseId: purchaseData?._id,
    }));

    const purchaseProductsData = await PurchaseProductModel.create(purchaseProducts);

    if (!purchaseProductsData || purchaseProductsData.length <= 0) {
      await purchaseData.remove();
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to create purchase",
      });
    }

    return res.status(201).json({
      data: purchaseData,
      success: true,
      message: "Purchase create successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: createPurchase ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE PURCHASE
const updatePurchase = async (req, res) => {
  try {
    const purchaseObj = {
      supplierId: req.body.supplierId,
      totalBill: req.body.totalBill,
      adminNote: req.body.adminNote,
    };
    const purchaseData = await PurchaseModel.findOneAndUpdate(
      { _id: req.params.purchaseId },
      { $set: purchaseObj },
      { new: true }
    );

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update purchase",
      });
    }

    // delete all previous purchase products
    await PurchaseProductModel.deleteMany({ purchaseId: req.params.purchaseId });

    const purchaseProducts = req.body.products.map((data) => ({
      ...data,
      purchaseId: purchaseData?._id,
    }));

    const purchaseProductsData = await PurchaseProductModel.create(purchaseProducts);

    if (!purchaseProductsData || purchaseProductsData.length <= 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update purchase",
      });
    }

    return res.status(201).json({
      data: purchaseData,
      success: true,
      message: "Purchase update successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: updatePurchase ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL PURCHASE
const fetchAllPurchase = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let statusMatchCondition = {};
    if (req.query.status === "ALL") {
      const purchaseStatus = ["PENDING", "CANCELED", "RECEIVED"];
      statusMatchCondition = {
        $match: {
          $expr: { $in: [{ $last: "$purchaseStatus.status" }, purchaseStatus] },
        },
      };
    } else {
      statusMatchCondition = {
        $match: {
          $expr: { $eq: [{ $last: "$purchaseStatus.status" }, req.query.status] },
        },
      };
    }

    const purchaseData = await PurchaseModel.aggregate([
      statusMatchCondition,
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "purchase_prods",
          let: { pId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$purchaseId", "$$pId"] } } },
            {
              $lookup: {
                from: "products",
                let: { prodId: "$productId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$prodId"] } } },
                  {
                    $project: {
                      name: 1,
                      slug: 1,
                      galleryImage: 1,
                      sku: 1,
                    },
                  },
                ],
                as: "productId",
              },
            },
            {
              $unwind: {
                path: "$productId",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "variations",
                let: { varId: "$variationId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$varId"] } } },
                  {
                    $lookup: {
                      from: "attribute_opts",
                      localField: "attributeOpts",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $lookup: {
                            from: "attributes",
                            localField: "attributeId",
                            foreignField: "_id",
                            pipeline: [
                              {
                                $project: {
                                  name: 1,
                                },
                              },
                            ],
                            as: "attribute",
                          },
                        },
                        {
                          $unwind: {
                            path: "$attribute",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            name: 1,
                            attributeId: "$attribute._id",
                            attributeName: "$attribute.name",
                          },
                        },
                      ],
                      as: "attributeOpts",
                    },
                  },
                  {
                    $project: {
                      attributeOpts: 1,
                    },
                  },
                ],
                as: "variationId",
              },
            },
            {
              $unwind: {
                path: "$variationId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "products",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          let: { supplierId: "$supplierId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$supplierId"] } } }],
          as: "supplierId",
        },
      },
      {
        $unwind: {
          path: "$supplierId",
          preserveNullAndEmptyArrays: true,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch purchase",
      });
    }

    return res.status(201).json({
      metaData: purchaseData[0]?.metadata[0],
      data: purchaseData[0]?.data,
      message:
        purchaseData[0]?.data?.length <= 0 ? "No data found!" : "Purchase fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** purchaseController: fetchAllPurchase ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE PURCHASE
const fetchSinglePurchase = async (req, res) => {
  try {
    const purchaseData = await PurchaseModel.aggregate([
      {
        $match: {
          serialId: req.params.serialId,
        },
      },
      {
        $lookup: {
          from: "purchase_prods",
          let: { pId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$purchaseId", "$$pId"] } } },
            {
              $lookup: {
                from: "products",
                let: { prodId: "$productId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$prodId"] } } },
                  {
                    $project: {
                      name: 1,
                      slug: 1,
                      galleryImage: 1,
                      sku: 1,
                    },
                  },
                ],
                as: "productId",
              },
            },
            {
              $unwind: {
                path: "$productId",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "variations",
                let: { varId: "$variationId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$varId"] } } },
                  {
                    $lookup: {
                      from: "attribute_opts",
                      localField: "attributeOpts",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $lookup: {
                            from: "attributes",
                            localField: "attributeId",
                            foreignField: "_id",
                            pipeline: [
                              {
                                $project: {
                                  name: 1,
                                },
                              },
                            ],
                            as: "attribute",
                          },
                        },
                        {
                          $unwind: {
                            path: "$attribute",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            name: 1,
                            attributeId: "$attribute._id",
                            attributeName: "$attribute.name",
                          },
                        },
                      ],
                      as: "attributeOpts",
                    },
                  },
                  {
                    $project: {
                      attributeOpts: 1,
                    },
                  },
                ],
                as: "variationId",
              },
            },
            {
              $unwind: {
                path: "$variationId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "products",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          let: { supplierId: "$supplierId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$supplierId"] } } }],
          as: "supplierId",
        },
      },
      {
        $unwind: {
          path: "$supplierId",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch purchase",
      });
    }

    return res.status(201).json({
      data: purchaseData[0],
      success: true,
      message: "Purchase fetch successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: fetchSinglePurchase ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DELETE PURCHASE
const deletePurchase = async (req, res) => {
  try {
    const checkPurchaseData = await PurchaseModel.findOne({
      _id: req.params.purchaseId,
      "purchaseStatus.status": "RECEIVED",
    });

    if (checkPurchaseData) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Received purchase couldn't be deleted.",
      });
    }

    const purchaseData = await PurchaseModel.findOneAndDelete({ _id: req.params.purchaseId });

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to delete purchase",
      });
    }

    await PurchaseProductModel.deleteMany({ purchaseId: req.params.purchaseId });
    if (purchaseData?.document) {
      deleteFile(purchaseData?.document);
    }

    return res.status(201).json({
      data: purchaseData,
      success: true,
      message: "Purchase delete successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: deletePurchase ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD PURCHASE NOTE
const addAdminNote = async (req, res) => {
  try {
    const purchaseData = await PurchaseModel.findOneAndUpdate(
      {
        _id: req.params.purchaseId,
      },
      {
        $push: {
          adminNote: {
            $each: [
              {
                message: req.body.note,
                time: req.body.time,
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

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to add note!`,
      });
    }

    return res.status(200).json({
      data: purchaseData?.adminNote,
      success: true,
      message: "Add note successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: addAdminNote ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE PURCHASE STATUS
const updatePurchaseStatus = async (req, res) => {
  try {
    const checkPurchaseData = await PurchaseModel.findOne({
      _id: { $in: req.body.purchaseIds },
      "purchaseStatus.status": {
        $in: ["CANCELED", "RECEIVED"],
      },
    });

    if (checkPurchaseData) {
      return res.status(409).json({
        data: null,
        success: false,
        message: `Couldn't update selected purchase status`,
      });
    }

    await PurchaseModel.updateMany(
      { _id: { $in: req.body.purchaseIds } },
      {
        $push: {
          purchaseStatus: {
            status: req.body.status,
            time: req.body.time,
            changeBy: req?.user?.role,
          },
        },
      }
    );

    if (req.body.status === "RECEIVED") {
      await PurchaseProductModel.updateMany(
        { purchaseId: { $in: req.body.purchaseIds } },
        {
          $set: {
            isReceived: true,
          },
        }
      );
    }

    const purchaseData = await PurchaseModel.aggregate([
      {
        $match: { _id: { $in: req.body.purchaseIds.map((i) => ObjectId(i)) } },
      },
      {
        $lookup: {
          from: "purchase_prods",
          let: { pId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$purchaseId", "$$pId"] } } }],
          as: "products",
        },
      },
    ]);

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update status!`,
      });
    }

    // ADD STOCK TO PRODUCT
    if (req.body.status === "RECEIVED") {
      await Promise.all(
        purchaseData.map(async (purchase) => {
          await Promise.all(
            purchase?.products.map(async (prod) => {
              if (prod?.isVariant) {
                await ProductModel.findOneAndUpdate(
                  {
                    _id: prod?.productId,
                  },
                  {
                    $inc: {
                      totalStock: Number(prod?.quantity) || 0,
                    },
                    $set: {
                      isUsed: true,
                    },
                  },
                  {
                    new: true,
                  }
                );
                await VariationModel.findOneAndUpdate(
                  {
                    _id: prod?.variationId,
                  },
                  {
                    $inc: {
                      stock: Number(prod?.quantity) || 0,
                      purchaseQty: Number(prod?.quantity) || 0,
                      totalPurchasePrice: Number(prod?.quantity) * Number(prod?.price) || 0,
                    },
                    $set: {
                      isUsed: true,
                    },
                  },
                  {
                    new: true,
                  }
                );
              } else {
                await ProductModel.findOneAndUpdate(
                  {
                    _id: prod?.productId,
                  },
                  {
                    $inc: {
                      totalStock: Number(prod?.quantity) || 0,
                      "nonVariation.stock": Number(prod?.quantity) || 0,
                      "nonVariation.purchaseQty": Number(prod?.quantity) || 0,
                      "nonVariation.totalPurchasePrice":
                        Number(prod?.quantity) * Number(prod?.price) || 0,
                    },
                    $set: {
                      isUsed: true,
                    },
                  },
                  {
                    new: true,
                  }
                );
              }
            })
          );
        })
      );
    }

    return res.status(200).json({
      data: purchaseData,
      success: true,
      message: "Update status successfully.",
    });
  } catch (err) {
    console.log("*** purchaseController: updatePurchaseStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH ORDERS BY ADMIN
const searchPurchase = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const purchaseData = await PurchaseModel.aggregate([
      {
        $lookup: {
          from: "suppliers",
          let: { supplierId: "$supplierId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$supplierId"] } } }],
          as: "supplierId",
        },
      },
      {
        $unwind: {
          path: "$supplierId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { "supplierId.phone": { $regex: req.body.value, $options: "i" } },
            { serialId: { $regex: req.body.value, $options: "i" } },
          ],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "purchase_prods",
          let: { pId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$purchaseId", "$$pId"] } } },
            {
              $lookup: {
                from: "products",
                let: { prodId: "$productId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$prodId"] } } },
                  {
                    $project: {
                      name: 1,
                      slug: 1,
                      galleryImage: 1,
                    },
                  },
                ],
                as: "productId",
              },
            },
            {
              $unwind: {
                path: "$productId",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "variations",
                let: { varId: "$variationId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$varId"] } } },
                  {
                    $lookup: {
                      from: "attribute_opts",
                      localField: "attributeOpts",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $lookup: {
                            from: "attributes",
                            localField: "attributeId",
                            foreignField: "_id",
                            pipeline: [
                              {
                                $project: {
                                  name: 1,
                                },
                              },
                            ],
                            as: "attribute",
                          },
                        },
                        {
                          $unwind: {
                            path: "$attribute",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            name: 1,
                            attributeId: "$attribute._id",
                            attributeName: "$attribute.name",
                          },
                        },
                      ],
                      as: "attributeOpts",
                    },
                  },
                  {
                    $project: {
                      attributeOpts: 1,
                    },
                  },
                ],
                as: "variationId",
              },
            },
            {
              $unwind: {
                path: "$variationId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "products",
        },
      },
      pagination(page, pageLimit),
    ]);

    if (!purchaseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch purchase",
      });
    }

    return res.status(201).json({
      metaData: purchaseData[0]?.metadata[0],
      data: purchaseData[0]?.data,
      message:
        purchaseData[0]?.data?.length <= 0 ? "No data found!" : "Purchase fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: searchOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const test = async (req, res) => {
  res.json({ data: "hi" });
};

module.exports = {
  createPurchase,
  updatePurchase,
  fetchAllPurchase,
  fetchSinglePurchase,
  deletePurchase,
  addAdminNote,
  updatePurchaseStatus,
  searchPurchase,

  test,
};
