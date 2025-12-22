const axios = require("axios");
const SmsModel = require("../models/user/sms");

const smsSend = async (phone, msg) => {
  try {
    const isValid = /^01\d{9}$/.test(phone);
    if (phone && msg && phone !== "undefined" && isValid) {
      const token = process.env.SMS_API_KEY;
      const sendMsg = await axios.get(
        `http://api.greenweb.com.bd/api.php?token=${token}&to=${phone}&message=${encodeURIComponent(
          msg
        )}`
      );
      console.log(sendMsg?.data.toLowerCase());
      if (sendMsg?.data.toLowerCase().startsWith(`ok`)) {
        await SmsModel.create({
          phone,
          message: msg,
        });
      }
    } else {
      console.log("Phone number is invalid");
    }

    return null;
  } catch (err) {
    return null;
  }
};

module.exports = smsSend;
