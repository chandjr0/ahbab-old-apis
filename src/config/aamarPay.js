const sandbox = {
  baseUrl: `https://sandbox.aamarpay.com`,
  storeId: `aamarpaytest`,
  signatureKey: `dbb74894e82415a2f7ff0ec3a97e4183`,
  initiatePayment: `https://sandbox.aamarpay.com/jsonpost.php`,
  // successUrl: `http://localhost:8074/payment-success`,
  successUrl: `payment-success`,
  failUrl: `payment-fail`,
  cancelUrl: `payment-cancel`,
  // CALLBACK API BASE URL
  apiBaseUrl: `192.168.0.242:8074/api/v1/aamarPay`,
};

const live = {
  baseUrl: `https://secure.aamarpay.com`,
  storeId: `believerssign`,
  signatureKey: `3629bcd21dbd00a8fe781ac75537b229`,
  initiatePayment: `https://secure.aamarpay.com/jsonpost.php`,
  successUrl: `payment-success`,
  failUrl: `payment-fail`,
  cancelUrl: `payment-cancel`,
  // CALLBACK API BASE URL
  apiBaseUrl: `api.believerssign.com/api/v1/aamarPay`,
};

module.exports = { sandbox, live };
