const axios = require("axios");
const config =
  process.env.PG_MODE === "prod"
    ? require("../../config/aamarPay").live
    : require("../../config/aamarPay").sandbox;

const protocol = process.env.PG_MODE === "prod" ? `https://` : `http://`;

const initiate = async (orderData) => {
  try {
    const payObj = {
      store_id: config.storeId,
      signature_key: config.signatureKey,
      tran_id: orderData.serialId,
      amount: String(orderData.customerCharge),
      currency: "BDT",
      desc: "Customer Order Payment",
      cus_name: orderData?.userName ?? "Name",
      cus_email: orderData?.email ?? "info@storex.com.bd",
      cus_phone: orderData?.phone,
      // origin : main, means , otherwise affiliate [ reseller ]
      success_url: `${protocol}${config.apiBaseUrl}/${config.successUrl}`,
      fail_url: `${protocol}${config.apiBaseUrl}/${config.failUrl}`,
      cancel_url:
        `${protocol}${config.apiBaseUrl}/${config.cancelUrl}` +
        `?domain=${encodeURIComponent(orderData.host)}&serialId=${encodeURIComponent(
          orderData.serialId
        )}&origin=main`,
      type: "json",
      opt_a: orderData.host,
      opt_b: orderData.serialId,
      opt_c: orderData.origin,
    };

    const { data } = await axios.post(config.initiatePayment, payObj);

    if (data.result !== "true") {
      const errorMessage = Object.keys(data).forEach((item) => data[item]);
      return { success: false, message: errorMessage };
    }
    return { success: true, url: data.payment_url };
  } catch (e) {
    // console.log(e.message);
    return { success: false, message: `error occurred while initiating payment` };
  }
};

module.exports = initiate;
