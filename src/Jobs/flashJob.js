const cron = require("node-cron");
const ProductModel = require("../models/product/product");
const FlashDealModel = require("../models/product/flashDealProduct");

const task = cron.schedule(
  // "0 0 0 * * *", // run at 12am
  // "* * */1 * * *", // run in every hour
  // "* * * * *", // every minute
  "*/5 * * * *", // every 5minute
  async () => {
    const flashDealData = await FlashDealModel.findOne({});

    if (
      new Date(flashDealData.startTime) <= new Date() &&
      new Date(flashDealData.endTime) >= new Date()
    ) {
      await ProductModel.updateMany(
        {
          _id: { $in: flashDealData?.products },
        },
        {
          $set: {
            isFlashDeal: true,
          },
        },
        { new: true }
      );
    } else {
      await ProductModel.updateMany(
        {
          _id: { $in: flashDealData?.products },
        },
        {
          $set: {
            isFlashDeal: false,
          },
        },
        { new: true }
      );
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Dhaka",
  }
);

task.start();
