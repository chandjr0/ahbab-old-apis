const cron = require("node-cron");
const mongoose = require("mongoose");
const axios = require("axios");
const OrderModel = require("../models/order/order");
const SteadfastTrackModel = require("../models/order/courierTrack/steadfastTrack");
const { updateProductStock } = require("../helpers/productQuery");
const CourierServiceModel = require("../models/courierServices/courierApi");

const { ObjectId } = mongoose.Types;

const task = cron.schedule(
  "0 * * * *", // every hour
  async () => {
    const allValidOrderTrackData = await SteadfastTrackModel.find({
      status: "running",
    });

    const courierServiceData = await CourierServiceModel.findOne();

    allValidOrderTrackData.map(async (data) => {
      let steadfastStatus = "";
      try {
        if (
          courierServiceData?.steadfast?.STEADFAST_API_KEY !== "" &&
          courierServiceData?.steadfast?.STEADFAST_SK !== ""
        ) {
          const parcelStatsD = await axios.get(
            `https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${data.trackId}`,
            {
              headers: {
                "Content-Type": "application/json",
                "Api-Key": courierServiceData?.steadfast?.STEADFAST_API_KEY,
                "Secret-Key": courierServiceData?.steadfast?.STEADFAST_SK,
              },
            }
          );

          steadfastStatus = parcelStatsD?.data?.delivery_status;
        }
      } catch (err) {
        console.log("Steadfast server error.");
      }

      if (steadfastStatus) {
        const steadfastTrackData = await SteadfastTrackModel.findOne({
          _id: data?._id,
        });

        if (
          [
            "pending",
            "delivered_approval_pending",
            "partial_delivered_approval_pending",
            "cancelled_approval_pending",
            "unknown_approval_pending",
            "hold",
            "in_review",
            "unknown",
          ].includes(steadfastStatus)
        ) {
          steadfastTrackData.status = "running";
          steadfastTrackData.steadfastKeys.status = steadfastStatus;
          await steadfastTrackData.save();

          await OrderModel.findOneAndUpdate(
            {
              _id: steadfastTrackData?.orderId,
            },
            {
              $set: {
                courierStatus: steadfastStatus,
              },
            },
            { new: true }
          );
        } else if (["delivered", "partial_delivered"].includes(steadfastStatus)) {
          steadfastTrackData.status = "complete";
          steadfastTrackData.steadfastKeys.status = steadfastStatus;

          await Promise.all([
            steadfastTrackData.save(),
            OrderModel.findOneAndUpdate(
              { _id: steadfastTrackData.orderId },
              [
                {
                  $set: {
                    courierStatus: steadfastStatus,
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
                            changeBy: "steadfast",
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
          ]);
        } else if (["cancelled"].includes(steadfastStatus)) {
          steadfastTrackData.status = "cancel";
          steadfastTrackData.steadfastKeys.status = steadfastStatus;
          await steadfastTrackData.save();

          const orderData = await OrderModel.findOne({
            _id: steadfastTrackData.orderId,
          });

          orderData.courierStatus = steadfastStatus;
          await orderData.save();
          await Promise.all(orderData.products.map((product) => updateProductStock(product, 1)));
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
