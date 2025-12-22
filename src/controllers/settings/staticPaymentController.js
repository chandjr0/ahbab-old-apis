const StaticPaymentModel = require("../../models/settings/staticPayment");

const uploadImage = require("../../utils/upload-img");
const updateSingleFile = require("../../utils/updateSingleImage");

const createStaticPayment = async (req, res) => {
  try {
    if (req.body.image !== "") {
      req.body.image = uploadImage(req.body.image, "public/settings/");
    }

    if (["reseller", "reseller_emp"].includes(req.user.role)) {
      req.body.resellerId = req.user._id;
    }

    const data = await StaticPaymentModel.create(req.body);

    if (!data) {
      return res.status(400).json({
        message: "Payment could not be created!",
        success: false,
      });
    }

    return res.status(201).json({
      data,
      message: "Payment created successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** staticPaymentController: createStaticPayment ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateStaticPayment = async (req, res) => {
  try {
    const checkPayment = await StaticPaymentModel.findOne({
      _id: req.params.paymentId,
    });

    if (!checkPayment) {
      return res.status(409).json({
        data: null,
        message: "Payment couldn't found!",
        success: false,
      });
    }

    req.body.image = updateSingleFile(checkPayment?.image, req.body.image, "public/settings/");

    const data = await StaticPaymentModel.findOneAndUpdate(
      { _id: req.params.paymentId },
      { $set: req.body },
      { new: true }
    );

    if (!data) {
      return res.status(400).json({
        message: "Payment could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data,
      message: "Payment updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** staticPaymentController: updateStaticPayment ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const deleteStaticPayment = async (req, res) => {
  try {
    const data = await StaticPaymentModel.findOneAndDelete({ _id: req.params.paymentId });

    if (!data) {
      return res.status(400).json({
        message: "Payment could not be deleted!",
        success: false,
      });
    }

    return res.status(200).json({
      data,
      message: "Payment deleted successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** staticPaymentController: deleteStaticPayment ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchAllStaticPayment = async (req, res) => {
  try {
    const data = await StaticPaymentModel.find({
      resellerId: ["reseller", "reseller_emp"].includes(req.user.role) ? req.user._id : null,
    });

    if (!data) {
      return res.status(400).json({
        message: "Couldn't fetch payments!",
        success: false,
      });
    }

    return res.status(200).json({
      data,
      message: "fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** staticPaymentController: fetchAllStaticPayment ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchSingleStaticPayment = async (req, res) => {
  try {
    const data = await StaticPaymentModel.findOne({ _id: req.params.paymentId });

    if (!data) {
      return res.status(400).json({
        message: "Couldn't fetch payment data!",
        success: false,
      });
    }

    return res.status(200).json({
      data,
      message: "fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** staticPaymentController: fetchSingleStaticPayment ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createStaticPayment,
  updateStaticPayment,
  deleteStaticPayment,
  fetchSingleStaticPayment,
  fetchAllStaticPayment,
};
