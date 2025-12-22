const bkashModel = require("../../models/onlinePayment/bkash");

const createBkash = async (req, res) => {
  const bkashData = await bkashModel.findOne({});
  if (!bkashData) {
    await bkashModel.create(req.body);
    return res.status(200).json({
        data: '', success: true, message: "BKash data created successfully"
    });
  } else {
    await bkashModel.updateOne({ _id: bkashData._id }, { $set: req.body });
    return res.status(200).json({
      data: '', success: true, message: "BKash data updated successfully"
    });
  }
}

const getBkash = async (req, res) => {      
  const bkashData = await bkashModel.findOne({});
  if (!bkashData) {
    return res.status(200).json({
      success: true, data: null, message: "BKash data not found",
    });
  }
  return res.status(200).json({
    success: true, data: bkashData, message: "BKash data fetched successfully"
  });
}

const getBkashActiveOrInactive = async (req, res) => {      
    const bkashData = await bkashModel.findOne({}, { isBkashActive: 1 });
    if (!bkashData) {
      return res.status(200).json({
        success: true, data: null, message: "BKash data not found",
      });
    }
    return res.status(200).json({
      success: true, data: bkashData, message: "BKash data fetched successfully"
    });
  }

module.exports = {
  createBkash, getBkash, getBkashActiveOrInactive
}
