const cron = require("node-cron");
const mongoose = require("mongoose");
const OrderModel = require("../models/order/order");
const CourierTrackModel = require("../models/order/courierTrack");
const RedxAxios = require("../service/courier/redxAxios");

const { ObjectId } = mongoose.Types;

const task = cron.schedule(
  "0 * * * *", // every hour
  async () => {
    const allValidOrderTrackData = await CourierTrackModel.find({
      status: "running",
    });

    allValidOrderTrackData.map(async (track) => {
      let parcelData = null;
      try {
        const parcelD = await RedxAxios.get(`/parcel/info/${track.trackId}`);
        parcelData = parcelD?.data?.parcel;
      } catch (err) {
        console.log("Redx server error.");
      }

      if (parcelData) {
        // new this status
        if (parcelData?.status === "delivery") {
          await Promise.all([
            OrderModel.findOneAndUpdate(
              { _id: track.orderId },
              [
                {
                  $set: {
                    "customerCharge.totalPayTk": { $sum: ["$customerCharge.TotalBill", 0] },
                    "customerCharge.remainingTkPay": 0,
                    adminRevenue: { $sum: ["$customerCharge.TotalBill", 0] },
                    "payment.amount": { $sum: ["$customerCharge.TotalBill", 0] },
                    orderStatus: {
                      $concatArrays: [
                        "$orderStatus",
                        [
                          {
                            status: "DELIVERED",
                            time: new Date().toISOString(),
                            changeBy: "REDX",
                            employeeId: null,
                            _id: ObjectId(),
                          },
                        ],
                      ],
                    },
                  },
                },
              ],
              {
                new: true,
              }
            ),
            CourierTrackModel.findOneAndUpdate(
              {
                _id: track?._id,
              },
              {
                $set: {
                  status: "complete",
                },
              },
              {
                new: true,
              }
            ),
          ]);
        }
        // new this status
        else if (parcelData?.status === "cancel") {
          await Promise.all([
            OrderModel.findOneAndUpdate(
              {
                _id: track?.orderId,
              },
              {
                $set: {
                  courierStatus: parcelData?.status,
                },
              },
              {
                new: true,
              }
            ),
            CourierTrackModel.findOneAndUpdate(
              {
                _id: track?._id,
              },
              {
                $set: {
                  status: "cancel",
                },
              },
              {
                new: true,
              }
            ),
          ]);
        } else {
          await OrderModel.findOneAndUpdate(
            {
              _id: track?.orderId,
            },
            {
              $set: {
                courierStatus: parcelData?.status,
              },
            },
            {
              new: true,
            }
          );
        }
      }
    });
  },
  {
    scheduled: true,
    timezone: "Asia/Dhaka",
  }
);

task.start();
