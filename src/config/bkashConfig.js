const bKashAccess = {
    grant_token: `/tokenized/checkout/token/grant`,
    refresh_token: `/tokenized/checkout/token/refresh`,
    payment: `/tokenized/checkout/create`,
    execute: `/tokenized/checkout/execute`,
    queryPayment: `/tokenized/checkout/payment/status`,
    search: `/tokenized/checkout/general/searchTran`,
    refund: `/tokenized/checkout/payment/refund`
};
  
module.exports = { bKashAccess };