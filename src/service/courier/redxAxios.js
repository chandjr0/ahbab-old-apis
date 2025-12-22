const Axios = require("axios");

const redxAxios = Axios.create({
  baseURL: "https://sandbox.redx.com.bd/v1.0.0-beta",
  maxBodyLength: Infinity,
  headers: {
    "Content-Type": "application/json",
    "API-ACCESS-TOKEN": process.env.REDX_API_KEY,
  },
});

module.exports = redxAxios;
