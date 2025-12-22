const ExpenseHeadModel = require("../../models/expense/expenseHead");
const ExpenseModel = require("../../models/expense/expense");
const pagination = require("../../helpers/paginationQuery");

//= === expense head ====
const expenseHeadCreate = async (req, res) => {
  try {
    const checkName = await ExpenseHeadModel.findOne({
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    }).lean();

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Expense head name already exist!",
      });
    }

    const data = await ExpenseHeadModel.create(req.body);

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
    console.log("*** expenseController: expenseHeadCreate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseHeadUpdate = async (req, res) => {
  try {
    const checkName = await ExpenseHeadModel.findOne({
      _id: { $ne: req.params.stickerId },
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    });

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Expense head name already exist!",
      });
    }

    const data = await ExpenseHeadModel.findOneAndUpdate(
      { _id: req.params.headId },
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
    console.log("*** expenseController: expenseHeadUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseHeadViewAll = async (req, res) => {
  try {
    const data = await ExpenseHeadModel.find({}).sort({ createdAt: -1 });

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
    console.log("*** expenseController: expenseHeadViewAll ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseHeadDelete = async (req, res) => {
  try {
    const data = await ExpenseHeadModel.findOneAndRemove({ _id: req.params.headId });
    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be deleted!",
      });
    }

    return res.status(200).json({
      data: null,
      success: true,
      message: "Deleted Successfully!",
    });
  } catch (err) {
    console.log("*** expenseController: expenseHeadDelete ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// === expense
const expenseCreate = async (req, res) => {
  try {
    const data = await ExpenseModel.create(req.body);

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
    console.log("*** expenseController: expenseCreate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseUpdate = async (req, res) => {
  try {
    const data = await ExpenseModel.findOneAndUpdate(
      { _id: req.params.expenseId },
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
    console.log("*** expenseController: expenseUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseDelete = async (req, res) => {
  try {
    const data = await ExpenseModel.findOneAndRemove({ _id: req.params.expenseId });
    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be deleted!",
      });
    }

    return res.status(200).json({
      data: null,
      success: true,
      message: "Deleted Successfully!",
    });
  } catch (err) {
    console.log("*** expenseController: expenseDelete ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const singleExpense = async (req, res) => {
  try {
    console.log("id: ", req.params.expenseId);
    const data = await ExpenseModel.findOne({
      _id: req.params.expenseId,
    });

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
      message: "View Successfully.",
    });
  } catch (err) {
    console.log("*** expenseController: singleExpense ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const expenseViewAll = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchDateRange = {};
    if (req.body.start && req.body.end) {
      matchDateRange = {
        createDate: { $gte: new Date(req.body.start), $lte: new Date(req.body.end) },
      };
    }

    const expenseData = await ExpenseModel.aggregate([
      {
        $match: {
          expenseType: { $regex: req.body.expenseType, $options: "i" },
        },
      },
      {
        $match: matchDateRange,
      },
      {
        $sort: { createdAt: -1 },
      },
      pagination(page, pageLimit),
    ]);

    const totalPrice = await ExpenseModel.aggregate([
      {
        $match: {
          expenseType: { $regex: req.body.expenseType, $options: "i" },
        },
      },
      {
        $project: {
          amount: 1,
        },
      },
      {
        $group: {
          _id: null,
          price: { $sum: "$amount" },
        },
      },
    ]);

    if (!expenseData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be viewed!",
      });
    }
    return res.status(200).json({
      metaData: expenseData[0]?.metadata[0]
        ? { ...expenseData[0]?.metadata[0], totalPrice: totalPrice[0]?.price || 0 }
        : [],
      data: expenseData[0]?.data ? expenseData[0]?.data : [],
      success: true,
      message: "View all Successfully.",
    });
  } catch (err) {
    console.log("*** expenseController: expenseHeadViewAll ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // expense head
  expenseHeadCreate,
  expenseHeadUpdate,
  expenseHeadViewAll,
  expenseHeadDelete,

  // expense
  expenseCreate,
  expenseUpdate,
  expenseDelete,
  singleExpense,
  expenseViewAll,
};
