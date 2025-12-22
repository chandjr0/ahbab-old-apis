const axios = require("axios");
const siteSettings = require("../models/settings/setting");
const { bKashAccess } = require("../config/bkashConfig");

const tokenHeader = (bkashConfigObj) => {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: bkashConfigObj?.bkashUsername,
        password: bkashConfigObj?.bkashPassword
    };
};

const grantToken = async (bkashConfigObj) => {
    try {
        const fullUrl = bkashConfigObj.bkashUrl.concat(`${bKashAccess.grant_token}`);
        const headConfig = tokenHeader(bkashConfigObj);
        const body = {
            app_key: bkashConfigObj.bkashAppKey,
            app_secret: bkashConfigObj.bkashAppSecret
        };
        const response = await axios.post(fullUrl, body, { headers: headConfig });
        if (response?.data) return response.data;
        else return null;
    } catch (error) {
        console.log("bkash grantToken error ============== ", error);
    }
};

const configHeader = (token, bkashConfigObj) => ({
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": bkashConfigObj.bkashAppKey
    }
});

const authHeader = async (bkashConfigObj) => {
    try {
        const settings = await siteSettings.findOne({}, { bkashTokenInfo: 1 });
        const { token, expireTime } = settings?.bkashTokenInfo || {};
        const currentTime = Date.now();
        if (token && expireTime > currentTime) return configHeader(token, bkashConfigObj);

        const newToken = await grantToken(bkashConfigObj);
        const newTokenInfo = { token: newToken?.id_token, expireTime: currentTime + 60 * 60 * 1000 };

        await siteSettings.updateOne({}, { bkashTokenInfo: newTokenInfo });
        return configHeader(newToken?.id_token, bkashConfigObj);
    } catch (error) {
        console.log("bkash authHeader error ============== ", error);
        return null;
    }
};

const executePayment = async (paymentID, authHeaders, bkashConfigObj) => {
    try {
        const fullUrl = `${bkashConfigObj.bkashUrl}${bKashAccess.execute}`;
        const body = { paymentID };
        const response = await axios.post(fullUrl, body, authHeaders);
        if (response?.data) return response?.data;
        else return null;
    } catch (error) {
        console.log("bkash executePayment error ============== ", error);
        return null;
    }
};
  
const queryPayment = async (paymentID, authHeaders, bkashConfigObj) => {
    try {
        const fullUrl = `${bkashConfigObj.bkashUrl}${bKashAccess.queryPayment}`;
        const body = { paymentID };
        const response = await axios.post(fullUrl, body, authHeaders);
        if (response?.data) return response?.data;
        else return null;
    } catch (error) {
        console.log("bkash queryPayment error ============== ", error);
        return null;
    }
};

const bkashRefund = async (refundPayload, authHeaders, bkashConfigObj) => {
    try {
        const fullUrl = `${bkashConfigObj.bkashUrl}${bKashAccess.refund}`;
        const response = await axios.post(fullUrl, refundPayload, authHeaders);
        if (response?.data) return response.data;
        else return null;
    } catch (error) {
        console.log("bkash bkashRefund error ============== ", error);
        return null;
    }
};

module.exports = {
    authHeader,
    executePayment,
    queryPayment,
    bkashRefund
};