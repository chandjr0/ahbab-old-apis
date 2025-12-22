const axios = require("axios");
const mongoose = require("mongoose");
const AdminOrderModel = require("../../models/adminOrder/adminOrder");
const ComboModel = require("../../models/comboProduct/combo");
const ResellerOrderModel = require("../../models/resellerOrder/resellerOrder");
const PathaoServiceModel = require("../../models/courierServices/pathaoService");
const LogModel = require("../../models/helpers/log");
const PathaoCityModel = require("../../models/courierServices/pathao/pathaoCity");
const PathaoZoneModel = require("../../models/courierServices/pathao/pathaoZone");
const PathaoStoresModel = require("../../models/courierServices/pathao/pathaoStores");
const PathaoAreasModel = require("../../models/courierServices/pathao/pathaoArea");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
const { bulkOrderPopulate } = require("../../helpers/allOrderQuery");
const WebHookModel = require("../../models/courierServices/webhook");

const { ObjectId } = mongoose.Types;

const updateAllPathaoInfo = async (req, res) => {
  try {
    let allCity = [];
    const allZone = [];
    let allStore = [];

    await axios
      .get(`${req.pathao.PATHAO_BASE}/stores`, {
        headers: {
          Authorization: `Bearer ${req.pathao.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((result) => {
        allStore = result?.data?.data?.data;
      })
      .catch(() =>
        res.status(400).json({
          data: null,
          success: false,
          message: "Failed to fetch pathao zones",
        })
      );

    // /*
    await axios
      .get(`${req.pathao.PATHAO_BASE}/countries/1/city-list`, {
        headers: {
          Authorization: `Bearer ${req.pathao.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((result) => {
        allCity = result?.data?.data?.data;
      })
      .catch(() =>
        res.status(400).json({
          data: null,
          success: true,
          message: "Failed to fetch pathao cities",
        })
      );

    // ------ allZone
    await Promise.all(
      allCity.map(async (city) => {
        await axios
          .get(`${req.pathao.PATHAO_BASE}/cities/${city?.city_id}/zone-list`, {
            headers: {
              Authorization: `Bearer ${req.pathao.accessToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
          .then((result) => {
            allZone.push(
              result?.data?.data?.data.map((i) => ({
                ...i,
                city_id: city?.city_id,
              }))
            );
          });
      })
    );
    const updateAllZone = allZone.flat();

    const storesBulkOpt = allStore.map((store) => ({
      updateOne: {
        filter: { store_id: store?.store_id },
        update: {
          $set: {
            store_id: store?.store_id,
            store_name: store?.store_name,
            store_address: store?.store_address,
          },
        },
        upsert: true,
      },
    }));

    const cityBulkOpt = allCity.map((city) => ({
      updateOne: {
        filter: { city_id: city?.city_id },
        update: { $set: city },
        upsert: true,
      },
    }));

    const zoneBulkOpt = updateAllZone.map((zone) => ({
      updateOne: {
        filter: { city_id: zone?.city_id, zone_id: zone?.zone_id },
        update: { $set: zone },
        upsert: true,
      },
    }));

    await Promise.all([
      // PathaoCityModel.insertMany(allCity),
      // PathaoZoneModel.insertMany(updateAllZone),
      // PathaoStoresModel.insertMany(allStore),

      PathaoStoresModel.bulkWrite(storesBulkOpt),
      PathaoCityModel.bulkWrite(cityBulkOpt),
      PathaoZoneModel.bulkWrite(zoneBulkOpt),
    ]);

    return res.json({
      allCity,
      updateAllZone,
      allStore,
    });
  } catch (err) {
    console.log("*** pathaoServiceController: getCities ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const getCities = async (req, res) => {
  try {
    const cityData = await PathaoCityModel.find().sort({ city_name: 1 });

    // Always return success with data array (even if empty)
    return res.status(200).json({
      data: cityData || [],
      success: true,
      message: cityData?.length > 0 ? "Get all cities" : "No cities found. Please sync Pathao data.",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: getCities ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: [],
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const getZones = async (req, res) => {
  try {
    // Convert cityId to number (route params come as strings)
    const cityId = parseInt(req.params.cityId, 10);
    
    if (isNaN(cityId)) {
      return res.status(400).json({
        data: [],
        success: false,
        message: "Invalid city ID",
      });
    }

    // Handle both with and without isActive field (for backward compatibility)
    // MongoDB stores city_id as number, so we query with number
    const zoneData = await PathaoZoneModel.find({
      city_id: cityId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    }).sort({ zone_name: 1 });

    // Always return success with data array (even if empty)
    return res.status(200).json({ 
      data: zoneData || [], 
      success: true, 
      message: zoneData?.length > 0 ? "Get all zones" : "No zones found for this district." 
    });
  } catch (err) {
    console.log("*** pathaoServiceController: getZones ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: [],
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const getAreas = async (req, res) => {
  try {
    let allArea = [];
    await axios
      .get(`${req.pathao.PATHAO_BASE}/zones/${req.params.zoneId}/area-list`, {
        headers: {
          Authorization: `Bearer ${req.pathao.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((result) => {
        allArea = result?.data?.data?.data;
        // res.status(200).json({
        //   data: result?.data?.data?.data,
        //   success: true,
        //   message: "Get all areas",
        // })
      })
      .catch(() => {
        console.log("Failed to fetch pathao areas");
        // res.status(400).json({
        //   data: null,
        //   success: true,
        //   message: "Failed to fetch pathao areas",
        // })
      });

    const areasBulkOpt = allArea.map((area) => ({
      updateOne: {
        filter: { area_id: area?.area_id },
        update: {
          $set: {
            zone_id: req.params.zoneId,
            area_id: area?.area_id,
            area_name: area?.area_name,
          },
        },
        upsert: true,
      },
    }));

    await PathaoAreasModel.bulkWrite(areasBulkOpt);
    const areaData = await PathaoAreasModel.find({
      zone_id: req.params.zoneId,
    });

    if (!areaData) {
      return res.status(400).json({
        data: null,
        success: true,
        message: "Failed to fetch pathao area",
      });
    }

    return res.status(200).json({
      data: areaData,
      success: true,
      message: "Get all areas",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: getAreas ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const getStores = async (req, res) => {
  try {
    let allStore = [];

    await axios
      .get(`${req.pathao.PATHAO_BASE}/stores`, {
        headers: {
          Authorization: `Bearer ${req.pathao.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((result) => {
        allStore = result?.data?.data?.data;
      })
      .catch(() => {
        console.log("Failed to fetch pathao stores");
      });

    const storesBulkOpt = allStore.map((store) => ({
      updateOne: {
        filter: { store_id: store?.store_id },
        update: {
          $set: {
            store_id: store?.store_id,
            store_name: store?.store_name,
            store_address: store?.store_address,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    await Promise.all([
      PathaoStoresModel.bulkWrite(storesBulkOpt),
      PathaoStoresModel.updateMany(
        {
          store_id: { $nin: allStore.map((i) => i?.store_id) },
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          multi: true,
        }
      ),
    ]);

    const storeData = await PathaoStoresModel.find();
    // const storeData = await PathaoStoresModel.find({ isActive: false });

    if (!storeData) {
      return res.status(400).json({
        data: null,
        success: true,
        message: "Failed to fetch pathao stores",
      });
    }

    return res.status(200).json({
      data: storeData,
      success: true,
      message: "Get all stores",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: getStores ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const createPathaoParcel = async (req, res) => {
  try {
    const {
      orderType,
      orderSerialId,
      customerName,
      customerPhone,
      customerAddress,
      totalQuantity,
      weight,
      collectionMoney,
      instruction,
      description,
    } = req.body;
    const storeId = req.body.store_id;
    const cityId = req.body.city_id;
    const zoneId = req.body.zone_id;
    // const areaId = req.body.area_id;

    let checkOrder = null;
    if (orderType === "admin") {
      checkOrder = await AdminOrderModel.findOne(
        {
          $expr: {
            $and: [
              {
                $eq: ["$serialId", orderSerialId],
              },
              {
                $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["PENDING", "CONFIRM"]],
              },
            ],
          },
        },
        {
          _id: 1,
          orderStatus: 1,
          "courierInfo.courierId": 1,
        }
      );
    } else {
      checkOrder = await ResellerOrderModel.findOne(
        {
          $expr: {
            $and: [
              {
                $eq: ["$serialId", orderSerialId],
              },
              {
                $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["PENDING", "CONFIRM"]],
              },
            ],
          },
        },
        {
          _id: 1,
          orderStatus: 1,
          "courierInfo.courierId": 1,
        }
      );
    }

    if (!checkOrder) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "This order couldn't be submitted to pathao!",
      });
    }

    const [cityData, zoneData] = await Promise.all([
      PathaoCityModel.findOne({
        city_id: req.body.city_id,
      }),
      PathaoZoneModel.findOne({
        zone_id: req.body.zone_id,
      }),
    ]);

    if (!cityData || !zoneData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "There is invalid city or zone data!s",
      });
    }

    const parcelObj = {
      store_id: storeId,
      merchant_order_id: orderSerialId,
      sender_name: req.pathao.PATHAO_SENDER_NAME,
      sender_phone: req.pathao.PATHAO_SENDER_PHONE,
      recipient_name: customerName,
      recipient_phone: customerPhone,
      recipient_address: customerAddress,
      recipient_city: cityId,
      recipient_city_name: cityData?.city_name,
      recipient_zone: zoneId,
      recipient_zone_name: zoneData?.zone_name,
      // recipient_area: areaId,
      // recipient_are_name: areaData?.area_name,
      delivery_type: "48",
      item_type: "2",
      item_quantity: totalQuantity,
      item_weight: weight,
      amount_to_collect: collectionMoney,
      special_instruction: instruction,
      item_description: description,
    };

    let pathaoResponse = null;
    await axios
      .post(`${req.pathao.PATHAO_BASE}/orders`, parcelObj, {
        headers: {
          Authorization: `Bearer ${req.pathao.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((result) => {
        if (result?.data?.type === "success") {
          pathaoResponse = result?.data?.data;
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({
          data: null,
          success: false,
          message: "Failed to create pathao parcel",
        });
      });

    if (!pathaoResponse) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit order data to pathao",
      });
    }

    const pathaoServiceObj = {
      orderType,
      orderId: checkOrder?._id,
      courierId: process.env.PATHAO_MONGO_ID,
      employeeId: req.user.role === "admin" ? null : req.user._id,
      createdBy: req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`,
      pathaoKeys: {
        ...parcelObj,
        consignment_id: pathaoResponse?.consignment_id,
        order_status: pathaoResponse?.order_status,
      },
    };

    const pathaoServiceData = await PathaoServiceModel.create(pathaoServiceObj);

    const courierInfo = {
      courierId: process.env.PATHAO_MONGO_ID,
      liveCourier: "pathao",
      courierTrackId: pathaoServiceData?._id,
      courierStatus: pathaoResponse?.order_status,
      time: new Date().toISOString(),
    };

    if (orderType === "admin") {
      await Promise.all([
        AdminOrderModel.findOneAndUpdate(
          {
            serialId: orderSerialId,
          },
          {
            $set: {
              courierInfo,
            },
            $push: {
              orderStatus: {
                status: "SHIPPED",
                time: new Date().toISOString(),
                changeBy: req.user.role === "admin" ? "admin" : req.user.name,
                employeeId: req.user.role === "admin" ? null : req.user._id,
              },
            },
          },
          {
            new: true,
          }
        ),
        LogModel.insertMany([
          {
            referObjectId: checkOrder?._id,
            message: `${
              req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
            } submit the order to pathao courier`,
            time: new Date().toISOString(),
          },
          {
            referObjectId: pathaoServiceData?._id,
            message: `Submit the parcel and parcel status is ${pathaoResponse?.order_status}`,
            time: new Date().toISOString(),
          },
        ]),
      ]);
    } else {
      await Promise.all([
        ResellerOrderModel.findOneAndUpdate(
          {
            serialId: orderSerialId,
          },
          {
            $set: {
              courierInfo,
            },
            $push: {
              orderStatus: {
                status: "SHIPPED",
                time: new Date().toISOString(),
                changeBy: req.user.role === "admin" ? "admin" : req.user.name,
                employeeId: req.user.role === "admin" ? null : req.user._id,
              },
            },
          },
          {
            new: true,
          }
        ),
        LogModel.insertMany([
          {
            referObjectId: checkOrder?._id,
            message: `${
              req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
            } submit the order to pathao courier`,
            time: new Date().toISOString(),
          },
          {
            referObjectId: pathaoServiceData?._id,
            message: `Submit the parcel and parcel status is ${pathaoResponse?.order_status}`,
            time: new Date().toISOString(),
          },
        ]),
      ]);
    }

    return res.status(200).json({
      data: pathaoServiceData,
      success: true,
      message: "Submit the order data to pathao courier.",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: createPathaoParcel ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const createPathaoBulkParcel = async (req, res) => {
  try {
    let checkOrderList = [];

    const matchCondition = {
      $expr: {
        $and: [
          {
            $in: ["$_id", req.body.orderIds.map((i) => ObjectId(i))],
          },
          {
            $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["PENDING", "CONFIRM"]],
          },
        ],
      },
    };

    if (req.body.orderType === "admin") {
      checkOrderList = await AdminOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        ...bulkOrderPopulate,
      ]);
    } else {
      checkOrderList = await ResellerOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        ...bulkOrderPopulate,
      ]);
    }

    if (!checkOrderList) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Some orders couldn't be submitted to pathao!",
      });
    }
    if (checkOrderList.length !== req.body.orderIds.length) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "There is some invalid order!",
      });
    }

    // return res.json({ checkOrderList });

    const allParcelObj = [];
    const allServiceObj = [];
    checkOrderList.forEach((orderData) => {
      allParcelObj.push({
        item_type: 2,
        store_id: req.body.store_id,
        merchant_order_id: orderData?.serialId,
        recipient_name: orderData?.deliveryAddress?.name,
        recipient_phone: orderData?.deliveryAddress?.phone,
        recipient_city: orderData?.deliveryAddress?.city?.city_id,
        recipient_zone: orderData?.deliveryAddress?.zone?.zone_id,
        // recipient_area: orderData?.deliveryAddress?.area?.area_id,
        recipient_address: orderData?.deliveryAddress?.address,
        amount_to_collect: Number(orderData?.customerCharge?.remainingTkPay) || 0,
        item_quantity: Number(orderData?.totalQty) || 1,
        item_weight: parseFloat(orderData?.totalWeight),
        item_description: "",
        special_instruction: "",
        delivery_type: 48,
      });

      allServiceObj.push({
        orderId: orderData?._id,
        store_id: req.body.store_id,
        merchant_order_id: orderData?.serialId,
        sender_name: req.pathao.PATHAO_SENDER_NAME,
        sender_phone: req.pathao.PATHAO_SENDER_PHONE,
        recipient_name: orderData?.deliveryAddress?.name,
        recipient_phone: orderData?.deliveryAddress?.phone,
        recipient_address: orderData?.deliveryAddress?.address,
        recipient_city: orderData?.deliveryAddress?.city?.city_id,
        recipient_city_name: orderData?.deliveryAddress?.city?.city_name,
        recipient_zone: orderData?.deliveryAddress?.zone?.zone_id,
        recipient_zone_name: orderData?.deliveryAddress?.zone?.zone_name,
        // recipient_area: orderData?.deliveryAddress?.area?.area_id,
        // recipient_area_name: orderData?.deliveryAddress?.area?.area_name,
        delivery_type: "48",
        item_type: "2",
        item_quantity: orderData?.totalQuantity,
        item_weight: Number(orderData?.totalWeight).toFixed(2),
        amount_to_collect: orderData?.customerCharge?.remainingTkPay,
        special_instruction: "",
        item_description: "",
      });
    });

    // return res.json({ allParcelObj });

    let pathaoResponse = null;
    const pathaoStatus = "pending_init";
    await axios
      .post(
        `${req.pathao.PATHAO_BASE}/orders/bulk`,
        { orders: allParcelObj },
        {
          headers: {
            Authorization: `Bearer ${req.pathao.accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((result) => {
        if (result?.data?.type === "success") {
          pathaoResponse = result?.data?.data;
          console.log("pathaoResponse: ", result?.data);
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({
          data: err,
          success: false,
          message: "Failed to create pathao parcel",
        });
      });

    // return res.json({ msg: "done" });
    if (!pathaoResponse) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit order data to pathao",
      });
    }

    const orderBulkOption = [];
    const logBulkOption = [];
    const allPathaoServiceObj = allServiceObj.map((parcel) => {
      const trackMongoId = mongoose.Types.ObjectId();
      const orderId = parcel?.orderId;

      // every single order updated this information
      orderBulkOption.push({
        updateOne: {
          filter: { _id: ObjectId(orderId) },
          update: {
            $set: {
              courierInfo: {
                courierId: process.env.PATHAO_MONGO_ID,
                liveCourier: "pathao",
                courierTrackId: trackMongoId,
                courierStatus: pathaoStatus,
                time: new Date().toISOString(),
              },
            },
            $push: {
              orderStatus: {
                status: "SHIPPED",
                time: new Date().toISOString(),
                changeBy: req.user.role === "admin" ? "admin" : req.user.name,
                employeeId: req.user.role === "admin" ? null : req.user._id,
              },
            },
          },
        },
      });

      // update all logs
      logBulkOption.push(
        {
          referObjectId: orderId,
          message: `${
            req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
          } submit the order to pathao courier`,
          time: new Date().toISOString(),
        },
        {
          referObjectId: trackMongoId,
          message: `Submit the parcel and parcel status is ${pathaoStatus}`,
          time: new Date().toISOString(),
        }
      );

      const parcelObj = { ...parcel };
      delete parcelObj.orderId;

      return {
        _id: trackMongoId,
        orderType: req.body.orderType,
        orderId,
        courierId: process.env.PATHAO_MONGO_ID,
        employeeId: req.user.role === "admin" ? null : req.user._id,
        createdBy: req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`,
        pathaoKeys: {
          ...parcelObj,
          consignment_id: "",
          order_status: pathaoStatus,
        },
      };
    });

    const pathaoServiceData = await PathaoServiceModel.insertMany(allPathaoServiceObj);

    if (req.body.orderType === "admin") {
      await Promise.all([
        AdminOrderModel.bulkWrite(orderBulkOption),
        LogModel.insertMany(logBulkOption),
      ]);
    } else {
      await Promise.all([
        ResellerOrderModel.bulkWrite(orderBulkOption),
        LogModel.insertMany(logBulkOption),
      ]);
    }

    return res.status(200).json({
      data: pathaoServiceData,
      success: true,
      message: "Submit the bulk order data to pathao courier.",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: createPathaoParcel ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateStatusByWebhook = async (req, res) => {
  try {
    // const { consignment_id, merchant_order_id, order_status, order_status_slug, updated_at } =
    //   req.body;

    await WebHookModel.create(req.body);

    const [pathaoServiceData] = await PathaoServiceModel.aggregate([
      {
        $match: {
          "pathaoKeys.merchant_order_id": req.body.merchant_order_id,
        },
      },
      {
        $lookup: {
          from: "admin_orders",
          localField: "orderId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "admin_order_products",
                let: { pId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$orderId", "$$pId"] } } }],
                as: "products",
              },
            },
            {
              $lookup: {
                from: "admin_order_combos",
                localField: "_id",
                foreignField: "orderId",
                pipeline: [
                  {
                    $lookup: {
                      from: "admin_order_combo_products",
                      localField: "orderId",
                      foreignField: "orderId",
                      pipeline: [
                        {
                          $lookup: {
                            from: "combo_products",
                            let: { pId: "$productId", cId: "$comboId" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $and: [
                                      { $eq: ["$productId", "$$pId"] },
                                      { $eq: ["$comboId", "$$cId"] },
                                    ],
                                  },
                                },
                              },
                              {
                                $project: {
                                  price: 1,
                                },
                              },
                            ],
                            as: "comboProducts",
                          },
                        },
                        {
                          $unwind: {
                            path: "$comboProducts",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            productId: 1,
                            isVariant: 1,
                            variationId: 1,
                            quantity: 1,
                            price: "$comboProducts.price",
                          },
                        },
                      ],
                      as: "products",
                    },
                  },
                ],
                as: "combos",
              },
            },
            {
              $project: {
                products: 1,
                combos: 1,
              },
            },
          ],
          as: "adminOrderData",
        },
      },
      {
        $unwind: {
          path: "$adminOrderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "reseller_orders",
          localField: "orderId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "reseller_order_products",
                let: { pId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$orderId", "$$pId"] } } }],
                as: "products",
              },
            },
            {
              $lookup: {
                from: "reseller_order_combos",
                localField: "_id",
                foreignField: "orderId",
                pipeline: [
                  {
                    $lookup: {
                      from: "reseller_order_combo_products",
                      localField: "orderId",
                      foreignField: "orderId",
                      pipeline: [
                        {
                          $lookup: {
                            from: "combo_products",
                            let: { pId: "$productId", cId: "$comboId" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $and: [
                                      { $eq: ["$productId", "$$pId"] },
                                      { $eq: ["$comboId", "$$cId"] },
                                    ],
                                  },
                                },
                              },
                              {
                                $project: {
                                  price: 1,
                                },
                              },
                            ],
                            as: "comboProducts",
                          },
                        },
                        {
                          $unwind: {
                            path: "$comboProducts",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            productId: 1,
                            isVariant: 1,
                            variationId: 1,
                            quantity: 1,
                            price: "$comboProducts.price",
                          },
                        },
                      ],
                      as: "products",
                    },
                  },
                ],
                as: "combos",
              },
            },
            {
              $project: {
                products: 1,
                combos: 1,
              },
            },
          ],
          as: "resellerOrderData",
        },
      },
      {
        $unwind: {
          path: "$resellerOrderData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!pathaoServiceData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Invalid pathao data!",
      });
    }

    if (
      !["Payment_Invoice"].includes(req.body.order_status_slug) &&
      pathaoServiceData?.status === "complete"
    ) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "This order have completed yet!",
      });
    }

    /*
    if (["Partial_Delivery", "On_Hold", "Payment_Invoice"].includes(req.body.order_status_slug)) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Not use these status right now!",
      });
    } */

    // "Pickup_Requested"
    // "Assigned_for_Pickup"
    // "Picked"
    // "At_the_Sorting_HUB"
    // "In_Transit"
    // "Received_at_Last_Mile_HUB"
    // "Assigned_for_Delivery"

    // "Delivered"

    // "Pickup_Cancelled"
    // "Pickup_Failed"
    // "Return"
    // "Delivery_Failed"

    let orderStatusName = "";
    let serviceStatus = "running";
    if (req.body.order_status_slug === "Delivered") {
      // serviceStatus = "complete";
      orderStatusName = "DELIVERED";
    } else if (["Pickup_Cancelled", "Pickup_Failed"].includes(req.body.order_status_slug)) {
      serviceStatus = "complete";
      orderStatusName = "CANCELED";
    } else if (["Return"].includes(req.body.order_status_slug)) {
      serviceStatus = "complete";
      orderStatusName = "RETURNED";
    } else if (["Payment_Invoice"].includes(req.body.order_status_slug)) {
      serviceStatus = "complete";
    }

    await PathaoServiceModel.findOneAndUpdate(
      {
        "pathaoKeys.merchant_order_id": req.body.merchant_order_id,
      },
      {
        $set: {
          status: serviceStatus,
          orderPayStatus: req.body.order_status_slug === "Payment_Invoice" ? "paid" : "unpaid",
          "pathaoKeys.consignment_id": req.body.consignment_id,
          "pathaoKeys.order_status": req.body.order_status_slug,
          "pathaoKeys.reason": req.body.reason || "",
        },
      },
      {
        new: true,
      }
    );

    let orderUpdateObj = {
      $set: {
        "courierInfo.courierStatus": req.body.order_status_slug,
        orderPayStatus: req.body.order_status_slug === "Payment_Invoice" ? "paid" : "unpaid",
      },
    };

    if (orderStatusName !== "") {
      orderUpdateObj = {
        ...orderUpdateObj,
        $push: {
          orderStatus: {
            status: orderStatusName,
            time: new Date().toISOString(),
            changeBy: "pathao",
            employeeId: null,
          },
        },
      };
    }

    const logArray = [
      {
        referObjectId: pathaoServiceData?.orderId,
        message: `Pathao update the courier status to ${req.body.order_status_slug}`,
        time: new Date(req.body.updated_at),
      },
      {
        referObjectId: pathaoServiceData?._id,
        message: `Pathao update the courier status to ${req.body.order_status_slug}`,
        time: new Date(req.body.updated_at),
      },
    ];

    const productBulkData = [];
    const variantBulkData = [];
    const comboBulkData = [];
    if (orderStatusName === "DELIVERED") {
      // ... add sell qty, sell price ...
      pathaoServiceData?.adminOrderData?.products.forEach((product) => {
        if (!product?.isVariant) {
          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(product?.productId) },
              update: {
                $inc: {
                  "nonVariation.sellQty": Number(product?.quantity),
                  "nonVariation.totalSellPrice": Number(product?.quantity) * Number(product?.price),
                },
              },
            },
          });
        } else {
          // .... bulk ...
          variantBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(product?.variationId) },
              update: {
                $inc: {
                  sellQty: Number(product?.quantity),
                  totalSellPrice: Number(product?.quantity) * Number(product?.price),
                },
              },
            },
          });
        }
      });

      pathaoServiceData?.adminOrderData?.combos.forEach((combo) => {
        combo.products.forEach((product) => {
          if (!product?.isVariant) {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    "nonVariation.sellQty": Number(combo?.quantity),
                    "nonVariation.totalSellPrice": Number(combo?.quantity) * Number(product?.price),
                  },
                },
              },
            });
          } else {
            variantBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.variationId) },
                update: {
                  $inc: {
                    sellQty: Number(combo?.quantity),
                    totalSellPrice: Number(combo?.quantity) * Number(product?.price),
                  },
                },
              },
            });
          }
        });
      });
    } else if (orderStatusName === "CANCELED") {
      pathaoServiceData?.adminOrderData?.products.forEach((product) => {
        if (!product?.isVariant) {
          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(product?.productId) },
              update: {
                $inc: {
                  "nonVariation.stock": Number(product?.quantity),
                  totalStock: Number(product?.quantity),
                  totalSell: -Number(product?.quantity),
                },
              },
            },
          });
        } else {
          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(product?.productId) },
              update: {
                $inc: {
                  totalStock: Number(product?.quantity),
                  totalSell: -Number(product?.quantity),
                },
              },
            },
          });

          variantBulkData.push({
            updateOne: {
              filter: { _id: ObjectId(product?.variationId) },
              update: {
                $inc: {
                  stock: Number(product?.quantity),
                },
              },
            },
          });
        }
      });

      pathaoServiceData?.adminOrderData?.combos.forEach((combo) => {
        combo.products.forEach((product) => {
          if (!product?.isVariant) {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    "nonVariation.stock": Number(combo?.quantity),
                    totalStock: Number(combo?.quantity),
                    totalSell: -1 * Number(combo?.quantity),
                    comboSell: -1 * Number(combo?.quantity),
                  },
                },
              },
            });
          } else {
            productBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.productId) },
                update: {
                  $inc: {
                    totalStock: Number(combo?.quantity),
                    totalSell: -1 * Number(combo?.quantity),
                    comboSell: -1 * Number(combo?.quantity),
                  },
                },
              },
            });

            variantBulkData.push({
              updateOne: {
                filter: { _id: ObjectId(product?.variationId) },
                update: {
                  $inc: {
                    stock: Number(combo?.quantity),
                  },
                },
              },
            });
          }
        });

        comboBulkData.push({
          updateOne: {
            filter: { _id: ObjectId(combo?.comboId) },
            update: {
              $inc: {
                totalSell: -1 * Number(combo?.quantity),
              },
            },
          },
        });
      });
    }

    const promiseArr = [
      ProductModel.bulkWrite(productBulkData),
      VariationModel.bulkWrite(variantBulkData),
      LogModel.insertMany(logArray),
    ];

    if (comboBulkData.length > 0) {
      promiseArr.push(ComboModel.bulkWrite(comboBulkData));
    }

    if (pathaoServiceData?.orderType === "admin") {
      promiseArr.push(
        AdminOrderModel.findOneAndUpdate(
          {
            _id: pathaoServiceData?.orderId,
          },
          orderUpdateObj,
          {
            new: true,
          }
        )
      );
    } else {
      promiseArr.push(
        ResellerOrderModel.findOneAndUpdate(
          {
            _id: pathaoServiceData?.orderId,
          },
          orderUpdateObj,
          {
            new: true,
          }
        )
      );
    }

    await Promise.all(promiseArr);

    return res.status(200).json({
      data: null,
      success: true,
      message: "Everything this is done..",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: updateStatusByWebhook ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const viewCourierDetails = async (req, res) => {
  try {
    const [pathaoServiceData] = await PathaoServiceModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.courierTrackId),
        },
      },
      {
        $lookup: {
          from: "logs",
          localField: "_id",
          foreignField: "referObjectId",
          pipeline: [
            {
              $project: {
                message: 1,
                time: 1,
              },
            },
          ],
          as: "logs",
        },
      },
    ]);

    if (!pathaoServiceData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Pathao courier data not found!",
      });
    }

    return res.status(200).json({
      data: pathaoServiceData,
      success: true,
      message: "Pathao courier data fetch successfully!",
    });
  } catch (err) {
    console.log("*** pathaoServiceController: viewCourierDetails ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  updateAllPathaoInfo,
  getCities,
  getZones,
  getAreas,
  getStores,
  createPathaoParcel,
  createPathaoBulkParcel,
  updateStatusByWebhook,
  viewCourierDetails,
};
