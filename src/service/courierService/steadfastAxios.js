const Axios = require("axios");

const steadfastAxios = Axios.create({
  baseURL: "https://portal.steadfast.com.bd/api/v1",
  headers: {
    "Content-Type": "application/json",
    "Api-Key": process.env.STEADFAST_API_KEY,
    "Secret-Key": process.env.STEADFAST_SK,
  },
});

module.exports = steadfastAxios;
