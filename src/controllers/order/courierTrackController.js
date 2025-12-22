const mongoose = require("mongoose");
const axios = require("axios");
const RedxAxios = require("../../service/courier/redxAxios");
const OrderModel = require("../../models/order/order");
const CourierTrackModel = require("../../models/order/courierTrack");
const SteadfastTrackModel = require("../../models/order/courierTrack/steadfastTrack");
const { updateProductStock } = require("../../helpers/productQuery");
const CourierServiceModel = require("../../models/courierServices/courierApi");

const { ObjectId } = mongoose.Types;

//= ============ REDX ==========
// REDX AREA
const fetchRedxAreas = async (req, res) => {
  try {
    // const arr = [
    //   {
    //     id: 1,
    //     name: "Test Area 1",
    //     post_code: 1212,
    //     district_name: "Test District 1",
    //     division_name: "Test Division",
    //     zone_id: 1,
    //   },
    //   {
    //     id: 2,
    //     name: "Test Area 2",
    //     post_code: 1212,
    //     district_name: "Test District 2",
    //     division_name: "Test Division",
    //     zone_id: 1,
    //   },
    //   {
    //     id: 3,
    //     name: "Test Area 3",
    //     post_code: 1212,
    //     district_name: "Test District 1",
    //     division_name: "Test Division",
    //     zone_id: 1,
    //   },
    // ];

    const areasData = [];
    try {
      const result = await RedxAxios.get("/areas");
      const resultData = result.data.areas;
      // const resultData = arr;
      resultData.forEach((area) => {
        const districtExit = areasData.find((d) => d?.name === area?.district_name);
        if (districtExit) {
          districtExit.areaList.push({
            id: area?.id,
            name: area?.name,
          });
        } else {
          areasData.push({
            name: area?.district_name,
            areaList: [
              {
                id: area?.id,
                name: area?.name,
              },
            ],
          });
        }
      });
    } catch (err) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Redx server error.",
      });
    }

    return res.status(201).json({
      data: areasData,
      success: true,
      message: "Fetch areas successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchRedxAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// CREATE REDX PARCEL
const createRedxParcel = async (req, res) => {
  try {
    const {
      orderId,
      courierId,
      courierName,
      customerName,
      customerPhone,
      customerAddress,
      deliveryArea,
      deliveryAreaId,
      merchantInvoiceId,
      cashCollectionAmount,
      parcelWeight,
      instruction,
      value,
      parcelDetailsJson,
    } = req.body;

    let trackId = "";

    try {
      const redxData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        delivery_area: deliveryArea,
        delivery_area_id: deliveryAreaId,
        merchant_invoice_id: merchantInvoiceId,
        cash_collection_amount: cashCollectionAmount,
        parcel_weight: parcelWeight,
        instruction,
        value,
        parcel_details_json: parcelDetailsJson,
      };

      const result = await RedxAxios.post("/parcel", redxData);
      trackId = result?.data?.tracking_id;
    } catch (err) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Redx server error.",
      });
    }

    const trackData = {
      orderId,
      courierId,
      trackId,
      employeeId: req.user.role === "employee" ? req.user._id : null,
      createdBy: req.user.role === "employee" ? req.user.name : "admin",
    };

    const courierTrackData = await CourierTrackModel.create(trackData);

    let parcelData = null;
    if (trackId) {
      try {
        const parcelD = await RedxAxios.get(`/parcel/info/${trackId}`);
        parcelData = parcelD?.data?.parcel;
      } catch (err) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Redx server error.",
        });
      }
    }

    await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
      },
      {
        $set: {
          courierTrackId: courierTrackData?._id,
          trackId,
          courierId,
          courierStatus: parcelData ? parcelData?.status : "",
        },
      },
      {
        new: true,
      }
    );

    return res.status(201).json({
      data: {
        trackId,
        courierTrackId: courierTrackData?._id,
        courierStatus: parcelData?.status || "",
        courierData: {
          _id: courierId,
          name: courierName,
        },
      },
      success: true,
      message: "Add redx courier succesfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchRedxAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// REDX: PARCEL DETAILS
const fetchRedxParcelDetails = async (req, res) => {
  try {
    const courierTrackData = await CourierTrackModel.findOne({
      _id: req.params.courierTrackId,
      status: { $ne: "cancel" },
    }).lean();

    let parcelData = null;
    let trackData = null;
    try {
      const [parcelD, trackD] = await Promise.all([
        RedxAxios.get(`/parcel/info/${courierTrackData.trackId}`),
        RedxAxios.get(`/parcel/track/${courierTrackData.trackId}`),
      ]);

      parcelData = parcelD?.data?.parcel;
      trackData = trackD?.data?.tracking;
    } catch (err) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Redx server error.",
      });
    }

    return res.status(201).json({
      data: { ...parcelData, trackData, createdBy: courierTrackData?.createdBy },
      success: true,
      message: "Fetch parcel Data successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchRedxAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// REMOVE REDX
const removeRedxFromOrder = async (req, res) => {
  try {
    const courierTrackData = await CourierTrackModel.findOneAndUpdate(
      {
        _id: req.params.courierTrackId,
        status: "running",
      },
      {
        $set: {
          status: "cancel",
        },
      },
      {
        new: true,
      }
    ).lean();

    if (!courierTrackData) {
      return res.status(400).json({
        data: courierTrackData,
        success: true,
        message: "Failed to Remove redx",
      });
    }

    await OrderModel.findOneAndUpdate(
      {
        _id: courierTrackData?.orderId,
      },
      {
        $set: {
          courierId: null,
          courierStatus: "",
          courierTrackId: null,
          courierName: "", // remove future
        },
      },
      {
        new: true,
      }
    );

    return res.status(201).json({
      data: courierTrackData,
      success: true,
      message: "Remove redx from order successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchRedxAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//= ============ STEADFAST ==========
// CREATE REDX PARCEL
const createSteadfastParcel = async (req, res) => {
  try {
    const {
      orderId,
      courierId,
      courierName,
      customerName,
      customerPhone,
      customerAddress,
      merchantInvoiceId,
      cashCollectionAmount,
      instruction,
    } = req.body;

    const courierServiceData = await CourierServiceModel.findOne();

    if (
      courierServiceData?.steadfast?.STEADFAST_API_KEY === "" ||
      courierServiceData?.steadfast?.STEADFAST_SK === ""
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Steadfast Api and Secret key is missing",
      });
    }

    const checkOrderData = await OrderModel.findOne({
      _id: orderId,
    });

    if (
      checkOrderData &&
      ["CANCELED", "DELIVERED", "RETURNED", "REFUND"].includes(
        checkOrderData?.orderStatus[checkOrderData.orderStatus.length - 1]?.status
      )
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Courier Couldn't be added",
      });
    }

    let trackId = "";
    let steadfastKeys = {};

    try {
      const steadfastData = {
        invoice: merchantInvoiceId,
        recipient_name: customerName,
        recipient_phone: customerPhone,
        recipient_address: customerAddress,
        cod_amount: cashCollectionAmount,
        note: instruction,
      };

      const result = await axios.post(
        "https://portal.steadfast.com.bd/api/v1/create_order",
        steadfastData,
        {
          headers: {
            "Content-Type": "application/json",
            "Api-Key": courierServiceData?.steadfast?.STEADFAST_API_KEY,
            "Secret-Key": courierServiceData?.steadfast?.STEADFAST_SK,
          },
        }
      );
      trackId = result?.data?.consignment?.tracking_code;
      steadfastKeys = {
        consignment_id: result?.data?.consignment?.consignment_id,
        invoice: result?.data?.consignment?.invoice,
        tracking_code: result?.data?.consignment?.tracking_code,
        recipient_name: result?.data?.consignment?.recipient_name,
        recipient_phone: result?.data?.consignment?.recipient_phone,
        recipient_address: result?.data?.consignment?.recipient_address,
        cod_amount: result?.data?.consignment?.cod_amount,
        status: result?.data?.consignment?.status,
        note: result?.data?.consignment?.note,
      };
    } catch (err) {
      console.log("steadfast error: ", err);
      return res.status(400).json({
        data: null,
        success: false,
        message: "Steadfast server error.",
      });
    }

    const trackData = {
      orderId,
      courierId,
      trackId,
      employeeId: req.user.role === "employee" ? req.user._id : null,
      createdBy: req.user.role === "employee" ? req.user.name : "admin",
      steadfastKeys,
    };

    const courierTrackData = await SteadfastTrackModel.create(trackData);

    await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
      },
      {
        $set: {
          liveCourier: "steadfast",
          courierTrackId: courierTrackData?._id,
          trackId,
          courierId,
          courierStatus: steadfastKeys ? steadfastKeys?.status : "",
        },
      },
      {
        new: true,
      }
    );

    return res.status(201).json({
      data: {
        trackId,
        courierTrackId: courierTrackData?._id,
        courierStatus: steadfastKeys?.status || "",
        courierData: {
          _id: courierId,
          name: courierName,
        },
      },
      success: true,
      message: "Add steadfast courier successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: createSteadfastParcel ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// STEADFAST: PARCEL DETAILS
const fetchSteadfastParcelDetails = async (req, res) => {
  try {
    const steadfastTrackData = await SteadfastTrackModel.findOne({
      _id: req.params.courierTrackId,
    });

    if (!steadfastTrackData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Data not found!",
      });
    }

    if (steadfastTrackData?.status === "complete") {
      return res.status(200).json({
        data: steadfastTrackData,
        success: true,
        message: "fetch data!",
      });
    }

    if (steadfastTrackData?.status === "cancel") {
      return res.status(200).json({
        data: steadfastTrackData,
        success: true,
        message: "fetch data!",
      });
    }

    const courierServiceData = await CourierServiceModel.findOne();

    if (
      courierServiceData?.steadfast?.STEADFAST_API_KEY === "" ||
      courierServiceData?.steadfast?.STEADFAST_SK === ""
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Steadfast Api and Secret key is missing",
      });
    }

    let steadfastStatus = "";
    try {
      const [parcelStatsD] = await Promise.all([
        axios.get(
          `https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${steadfastTrackData.trackId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Api-Key": courierServiceData?.steadfast?.STEADFAST_API_KEY,
              "Secret-Key": courierServiceData?.steadfast?.STEADFAST_SK,
            },
          }
        ),
      ]);

      steadfastStatus = parcelStatsD?.data?.delivery_status;
    } catch (err) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Steadfast server error.",
      });
    }

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

    return res.status(201).json({
      data: steadfastTrackData,
      success: true,
      message: "Fetch parcel Data successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchSteadfastParcelDetails ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// REMOVE STEADFAST
const removeSteadfastFromOrder = async (req, res) => {
  try {
    const courierTrackData = await CourierTrackModel.findOne({
      _id: req.params.courierTrackId,
    });

    if (!courierTrackData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to Remove redx",
      });
    }

    if (
      courierTrackData?.status !== "cancel" &&
      courierTrackData?.steadfastKeys?.status !== "cancelled"
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "This Courier not be deleted right now",
      });
    }

    await OrderModel.findOneAndUpdate(
      {
        _id: courierTrackData?.orderId,
      },
      {
        $set: {
          courierId: null,
          courierStatus: "",
          courierTrackId: null,
          courierName: "", // remove future
        },
      },
      {
        new: true,
      }
    );

    return res.status(201).json({
      data: courierTrackData,
      success: true,
      message: "Remove redx from order successfully.",
    });
  } catch (err) {
    console.log("*** courierTrackController: fetchRedxAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // redx
  fetchRedxAreas,
  createRedxParcel,
  fetchRedxParcelDetails,
  removeRedxFromOrder,

  // steadfast
  createSteadfastParcel,
  fetchSteadfastParcelDetails,
  removeSteadfastFromOrder,
};
