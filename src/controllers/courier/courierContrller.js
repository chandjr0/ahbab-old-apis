const CourierModel = require("../../models/courier/courier");
const OrderModel = require("../../models/order/order");

const CourierCreate = async (req, res) => {
  try {
    const checkName = await CourierModel.findOne({
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    }).lean();

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Courier name already exist!",
      });
    }

    const data = await CourierModel.create(req.body);

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
    console.log("*** courierController: CourierCreate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const courierUpdate = async (req, res) => {
  try {
    if (
      [process.env.REDX_MONGO_ID, process.env.STEADFAST_MONGO_ID].includes(req.params.courierId)
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be updated right now!",
      });
    }

    const checkName = await CourierModel.findOne({
      _id: { $ne: req.params.courierId },
      name: { $regex: `^${req.body.name}$`, $options: "i" },
    });

    if (checkName) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Courier name already exist!",
      });
    }

    const data = await CourierModel.findOneAndUpdate(
      { _id: req.params.courierId },
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
    console.log("*** courierController: courierUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const courierViewAll = async (req, res) => {
  try {
    const data = await CourierModel.find({}).sort({ createdAt: -1 });

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
    console.log("*** courierController: courierViewAll ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const courierDelete = async (req, res) => {
  try {
    if (
      [process.env.REDX_MONGO_ID, process.env.STEADFAST_MONGO_ID].includes(req.params.courierId)
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be deleted right now",
      });
    }

    const checkInOrder = await OrderModel.findOne({
      courierId: req.params.courierId,
    });

    if (checkInOrder) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be deleted!",
      });
    }

    const data = await CourierModel.findOneAndRemove({ _id: req.params.courierId });
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
    console.log("*** courierController: courierDelete ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const courierStatusUpdate = async (req, res) => {
  try {
    const { id, status } = req.body;
    const courierData = await CourierModel.findOneAndUpdate({_id: id}, { $set: { status: status } }, {new: true});
    if (!courierData) {
      return res.status(400).json({
        data: null, success: false, message: "Courier status in not updated!",
      });
    }

    return res.status(200).json({
      data: courierData, success: true, message: "Courier status update successfully!",
    });
  } catch (err) {
    console.log("*** courierController: courierStatusUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null, success: false, message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  CourierCreate,
  courierUpdate,
  courierViewAll,
  courierDelete,
  courierStatusUpdate
};
