const ShowroomModel = require("../../models/settings/showroom");

const showroomCreate = async (req, res) => {
  try {
    const data = await ShowroomModel.create(req.body);

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
    console.log("*** showroomController: showroomCreate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const showroomUpdate = async (req, res) => {
  try {
    const data = await ShowroomModel.findOneAndUpdate(
      { _id: req.params.showroomId },
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
    console.log("*** showroomController: showroomUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const showroomViewAll = async (req, res) => {
  try {
    const data = await ShowroomModel.find({}).sort({ createdAt: -1 });

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
    console.log("*** showroomController: showroomViewAll ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const showroomView = async (req, res) => {
  try {
    const data = await ShowroomModel.findOne({ _id: req.params.showroomId });

    if (!data) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Could not be view!",
      });
    }

    return res.status(200).json({
      data,
      success: true,
      message: "view Successfully!",
    });
  } catch (err) {
    console.log("*** showroomController: showroomView ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const showroomDelete = async (req, res) => {
  try {
    const data = await ShowroomModel.findOneAndRemove({ _id: req.params.showroomId });
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
    console.log("*** showroomController: showroomDelete ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  showroomCreate,
  showroomUpdate,
  showroomViewAll,
  showroomView,
  showroomDelete,
};
