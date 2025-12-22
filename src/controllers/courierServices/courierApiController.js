const CourierServiceModel = require("../../models/courierServices/courierApi");
const PathaoStoresModel = require("../../models/courierServices/pathao/pathaoStores");

const courierServiceUpdate = async (req, res) => {
  try {
    const obj = {
      steadfast: req.body.steadfast,
      pathao: { ...req.body.pathao, accessToken: "" },
    };
    const data = await CourierServiceModel.findOneAndUpdate(
      {},
      { $set: obj },
      { new: true, upsert: true }
    );

    if (!data) {
      res.status(400).json({
        data: null,
        success: false,
        message: "Could not be updated!",
      });
    }

    await PathaoStoresModel.deleteMany({});

    return res.status(200).json({
      data,
      success: true,
      message: "Updated Successfully!",
    });
  } catch (err) {
    console.log("*** courierServiceController: courierServiceUpdate ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const courierView = async (req, res) => {
  try {
    const data = await CourierServiceModel.findOne();

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
    console.log("*** courierServiceController: courierView ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  courierServiceUpdate,
  courierView,
};
