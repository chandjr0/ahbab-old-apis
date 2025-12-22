const axios = require("axios");
const bizSdk = require("facebook-nodejs-business-sdk");
const sha256 = require("sha256");
const settingModel = require("../../models/settings/setting");
const ResellerSettingModel = require("../../models/settings/resellerSetting");
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");
const address = require("address");


async function getAddressByIP(ipOrHost) {
  try {
    const res = await axios.get(
      `https://tools.keycdn.com/geo.json?host=${ipOrHost}`,
      {
        headers: {
          "keycdn-tools": "https?://.*",
          "Content-Type": "application/json",
          "User-Agent": "keycdn-tools:https://*",
        },
      }
    );

    const geo = res.data.data.geo;
    return {
        country: geo.country_code.toLowerCase(),
        state: geo.region_name,
        city: geo.city,
        postal_code: geo.postal_code,
    }
  } catch (error) {
    return {
        country: 'BD',
        state: '',
        city: '',
        postal_code: '',
    }
  }
};

async function getGenderByName(name) {
  try {
    const maleNameRegex =
      /\b(?:Md\.?|Mohammad|Mohammed|Muhammad|Mohamed|Mir|Abdul|Ali|Shah|Rana|Guest|Admin|Super)\b/i;
    const femaleNameRegex =
      /\b(?:Mrs?\.?|Miss|Ms\.?|Ma'am|Madam|Begum|Akter|Akhter|Khatun|Rani|Israt)\s*[A-Z][a-z]*\b/g;

    if (new RegExp(maleNameRegex).test(name)) {
      return "m";
    } else if (new RegExp(femaleNameRegex).test(name)) {
      return "f";
    }

    const res = await axios.get(
      `https://api.genderize.io/?name=${name}&country_id=BD`
    );
    // Check if gender exists and is an array with at least one element
    if (res.data && Array.isArray(res.data.gender) && res.data.gender.length > 0) {
      return res.data.gender[0];
    } else {
      return null; // If no gender data is returned
    }
  } catch (error) {
    console.log(`getGenderByName ${name} ${error.message}`);
    return undefined; // Return undefined if error occurs
  }
}

// sdk
const adminFbEvents = async (req, res) => {
  try {
    // console.log("admin: ", req.body);
    const settingsData = await settingModel.findOne({}, { "allScript.fbScript": 1 });

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        success: true,
        message: "Failed Purchase event hit",
      });
    }

    await axios
      .post(
        `https://graph.facebook.com/v18.0/${settingsData?.allScript?.fbScript?.header}/events`,
        {
          data: req.body.fbData,
          access_token: settingsData?.allScript?.fbScript?.accessToken,
        }
      )
      .then((result) => console.log("conversion result data: ", result.data))
      .catch((err) => {
        console.log("error: ", err.response.data);
        console.log("Failed to hit conversion api..");
      });

    return res.status(200).json({
      data: null,
      success: true,
      message: "Purchase event hit",
    });
  } catch (err) {
    console.log("*** conversionApiController: adminFbEvents ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerFbEvents = async (req, res) => {
  // console.log("reseller: ", req.body);
  try {
    const settingsData = await ResellerSettingModel.findOne(
      { resellerId: req.reseller._id },
      { "allScript.fbScript": 1 }
    );

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        success: true,
        message: "Failed Purchase event hit",
      });
    }

    // console.log("req.body: ", req.body);
    // console.log("pixelId: ", settingsData?.allScript?.fbScript?.header);
    // console.log("accessToken: ", settingsData?.allScript?.fbScript?.accessToken);

    await axios
      .post(
        `https://graph.facebook.com/v18.0/${settingsData?.allScript?.fbScript?.header}/events`,
        {
          data: req.body.fbData,
          //   test_event_code: "TEST48351",
          access_token: settingsData?.allScript?.fbScript?.accessToken,
        }
      )
      .then((result) => console.log("conversion result data: ", result.data))
      .catch((err) => {
        console.log("error: ", err.response.data);
        console.log("Failed to hit conversion api..");
      });

    return res.status(200).json({
      data: null,
      success: true,
      message: "Purchase event hit",
    });
  } catch (err) {
    console.log("*** conversionApiController: resellerFbEvents ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerFbEventSDK = async (req, res) => {
  try {
    const { DeliveryCategory, ServerEvent, EventRequest, UserData, CustomData, Content } = bizSdk;
    const {
      eventType,
      fbClickId,
      userIpAddress,
      userAgent,
      host,
      deliveryAddress,
      products,
      totalProductPrice,
    } = req.body;

    const settingsData = await ResellerSettingModel.findOne(
      { resellerId: req.reseller._id },
      { "allScript.fbScript": 1 }
    );

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        success: true,
        message: "Failed Purchase event hit",
      });
    }

    const { accessToken, header } = settingsData.allScript.fbScript;
    const pixelID = header;
    bizSdk.FacebookAdsApi.init(accessToken);
    const currentTimestamp = Math.floor(new Date() / 1000);
    const randomNumber = Math.floor(Math.random() * 61029929918827) + 1;

    // ----------------

    let userData = null;

    if (eventType === "Purchase") {
      userData = new UserData()
        .setPhone(sha256(`+88${deliveryAddress?.phone}`))
        .setFirstName(sha256(deliveryAddress?.name))
        .setCity(deliveryAddress?.city ? deliveryAddress?.city.toLowerCase() : "dhaka")
        .setCountry(sha256("Bangladesh"))
        .setClientIpAddress(userIpAddress)
        .setClientUserAgent(userAgent)
        .setFbc(fbClickId)
        .setFbp(`fb.1.${currentTimestamp}.${randomNumber}`);
    } else {
      userData = new UserData()
        .setClientIpAddress(userIpAddress)
        .setClientUserAgent(userAgent)
        .setFbc(fbClickId)
        .setFbp(`fb.1.${currentTimestamp}.${randomNumber}`);
    }
    // ----------------

    const content = new Content()
      .setId(products[0]?.sku)
      .setQuantity(products[0]?.quantity || 1)
      .setItemPrice(products[0]?.price)
      .setTitle(products[0]?.name)
      .setCategory(products[0]?.category || "clothing")
      .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY);

    const customData = new CustomData()
      .setContentName(products[0]?.name)
      .setContentIds([products[0]?.sku])
      .setContentCategory(products[0]?.category || "clothing")
      .setContentType("product")
      .setContents([content])
      .setCurrency("BDT")
      .setValue(
        eventType === "Purchase"
          ? totalProductPrice
          : products.reduce((prev, cur) => prev + cur.quantity * cur.price, 0)
      );

    const serverEvent = new ServerEvent()
      .setEventName(eventType)
      .setEventTime(currentTimestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(`https://${host}/products/${products[0]?.slug}`)
      .setActionSource("website");

    const eventRequest = new EventRequest(accessToken, pixelID).setEvents([serverEvent]);
    eventRequest.execute().then(
      () => {
        console.log("Executes All Requests OK.");
      },
      (err) => {
        console.error("Error: ", err);
      }
    );

    return res.status(200).json({
      data: null,
      success: true,
      message: "Event hit successfully!",
    });
  } catch (err) {
    console.log("*** conversionApiController: resellerFbEventSDK ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const adminFbEventsSDK = async (req, res) => {
  try {
    const { DeliveryCategory, ServerEvent, EventRequest, UserData, CustomData, Content } = bizSdk;
    const { eventType, fbClickId, fullUrl, user, products, orderId, totalPrice } = req.body;

    const settingsData = await settingModel.findOne({}, { "allScript.fbScript": 1 });
    if (!settingsData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "AccessToken or PixelID not found!",
      });
    }

    const { accessToken, header } = settingsData.allScript.fbScript;
    if(!accessToken || !header) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "AccessToken or PixelID not found!",
      });
    }

    const pixelID = header;
    bizSdk.FacebookAdsApi.init(accessToken);

    const currentTimestamp = Math.floor(new Date() / 1000);
    const externalId = uuidv4();
    const eventId = uuidv4();
    const fbp = req.headers?.cookie?._fbp || `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const fbc = req.headers?.cookie?._fbc || `fb.1.${Date.now()}.${fbClickId}`;
    const currency = "BDT";
    const userIpAddress = req.headers["x-forwarded-for"] || address.ip() || "116.204.148.239";
    const userAgent = req.get("user-agent");

    const geo = await getAddressByIP(userIpAddress);
    // console.log('location details ========= ', geo);
    const userObject = {
      firstName: user?.name ? user.name : 'N/A',
      lastName: user?.name ? user?.name[user?.name?.length - 1] : 'N/A',
      phone: user?.phone ? user.phone : 'N/A',
      email: user?.email ? user.email : 'N/A',
      gender: 'm',
      city: geo?.state || 'Dhaka',
      state: geo?.state || 'Dhaka',
      zipCode: geo?.postal_code || '1200',
      country: geo?.country || 'BD'
    }

    // console.log('user object =========== ', userObject);

    const userData = new UserData()
      .setClientIpAddress(userIpAddress)
      .setCountry(sha256(userObject.country))
      .setClientUserAgent(userAgent)
      .setFbc(fbc)
      .setFbp(fbp)
      .setExternalId(sha256(externalId))
      .setFirstName(sha256(userObject.firstName))
      .setLastName(sha256(userObject.lastName))
      .setPhone(sha256(userObject.phone))
      .setEmail(sha256(userObject.email))
      .setGender(sha256(userObject.gender))
      .setCity(sha256(userObject.city))
      .setState(sha256(userObject.state))
      .setZip(sha256(userObject.zipCode));

    const getContent = (product) =>
      new Content()
        .setId(product?.sku)
        .setDescription(product?.description)
        .setQuantity(product?.qty || 1)
        .setItemPrice(product?.price)
        .setTitle(product?.name)
        .setCategory(product?.categories?.[0]?.name || "Uncategorized")
        .setDeliveryCategory(`home_delivery`);

    const getCustomDataContent = (product) => {
      const customData = new CustomData()
        .setContentName(product.name)
        .setContentIds([product?.sku])
        .setContentCategory(product?.categoryName || "Uncategorized")
        .setContentType("product")
        .setContents([getContent(product)])
        .setCurrency(currency)
        .setValue(product?.price)
        .setItemNumber(product?.sku)
        .setNumItems(product?.qty || 1)
        .setCustomProperties({
          id: product?.sku,
          content_id: product?.sku,
          description: product.description || " ...",
          availability: product?.stackAvailable > 0 ? "in stock" : "out of stock",
          condition: "new",
          price: product.price,
        })
        .setDeliveryCategory(`home_delivery`);
    
      if (orderId) {
        customData.setStatus("pending").setOrderId(orderId);
      }
      return customData;
    };

    const eventsData = [];
    if(req.body?.eventType === 'PageView') {
      const PageViewContent = new ServerEvent()
        .setEventId(eventId)
        .setEventName("PageView")
        .setEventTime(currentTimestamp)
        .setUserData(userData)
        .setEventSourceUrl(fullUrl)
        .setActionSource("website");

      // console.log("PageViewContent == after data set == ", PageViewContent);
      eventsData.push(PageViewContent);
    }

    if(req.body?.eventType === 'ViewContent') {
      const ViewContent = new ServerEvent()
        .setEventId(eventId)
        .setEventName("ViewContent")
        .setEventTime(currentTimestamp)
        .setUserData(userData)
        .setCustomData(getCustomDataContent(products[0]))
        .setEventSourceUrl(fullUrl)
        .setActionSource("website");

      // console.log("ViewContent == after data set == ", ViewContent);
      eventsData.push(ViewContent);
    }

    if (req.body?.eventType === "AddToCart") {
      console.log("AddToCart content!!!!!!!!!!!!!!!!!!!!");

      const AddToCart = new ServerEvent()
        .setEventId(eventId)
        .setEventName("AddToCart")
        .setEventTime(currentTimestamp)
        .setUserData(userData)
        .setCustomData(getCustomDataContent(products[0]))
        .setEventSourceUrl(fullUrl)
        .setActionSource("website");

      eventsData.push(AddToCart);
    }

    if (req.body?.eventType === "InitiateCheckout") {
      console.log("InitiateCheckout content!!!!!!!!!!!!!!!!!!!!");

      const InitiateCheckout = new ServerEvent()
        .setEventId(eventId)
        .setEventName("InitiateCheckout")
        .setEventTime(currentTimestamp)
        .setUserData(userData)
        .setCustomData(getCustomDataContent(products[0]))
        .setEventSourceUrl(fullUrl)
        .setActionSource("website");

      eventsData.push(InitiateCheckout);
    }

    if (req.body?.eventType === "Purchase") {
      console.log("Purchase content!!!!!!!!!!!!!!!!!!!!");

      const Purchase = new ServerEvent()
        .setEventId(eventId)
        .setEventName("Purchase")
        .setEventTime(currentTimestamp)
        .setUserData(userData)
        .setCustomData(getCustomDataContent(products[0]))
        .setEventSourceUrl(fullUrl)
        .setActionSource("website");

      eventsData.push(Purchase);
    }

    let eventSuccess = false;
    const eventRequest = new EventRequest(accessToken, pixelID).setEvents(eventsData);
    try {
      const result = await eventRequest.execute();
      console.log('result ================= ', result);

      if(result?.events_received === 1) eventSuccess = true;
    } catch (error) {
      console.error("Server Event Failed:", error.response ? error.response.data : error.message);
    }

    const response = {
      eventId,
      externalId,
      fbp,
      fbc,
      currentTimestamp,
      currency,
      userIpAddress,
      userAgent,
      fullUrl: req.body?.fullUrl,
      eventType: req.body?.eventType,
      user: userObject,
      products
    }

    return res.status(200).json({
      data: response,
      success: eventSuccess ? true : false,
      message: "Event hit successfully!",
    });
  } catch (err) {
    console.log("*** conversionApiController: adminFbEvents ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  adminFbEvents,
  resellerFbEvents,

  adminFbEventsSDK,
  resellerFbEventSDK,
};
