const async = require("async");

// const pgModel = require("../../models/onlinePayment/paymentResponse");
const AdminOrderModel = require("../../models/adminOrder/adminOrder");
const ResellerOrderModel = require("../../models/resellerOrder/resellerOrder");

const protocol = process.env.PG_MODE === "prod" ? `https://` : `http://`;

let domain;
let redirectUrl;

const callback = async (req, res) => {
  try {
    let orderModObj;
    let payHisObj;
    let model;
    let serialId;

    if (req.query.status === "cancel") {
      model = req.query.origin === "main" ? AdminOrderModel : ResellerOrderModel;
      domain = req.query.domain;
      serialId = req.query.serialId;
    } else {
      model = req.body.opt_c === "main" ? AdminOrderModel : ResellerOrderModel;
      domain = req.body.opt_a;
      req.body.tran_id = req.body.opt_b;
      serialId = req.body.opt_b;
    }

    if (req.query.status === "success") {
      redirectUrl = `${protocol}${domain}/payment-successful/${req.body.tran_id}`;
      orderModObj = {
        "onlinePayment.status": req.body.pay_status,
        "payment.paymentType": req.body.card_type,
        "payment.amount": req.body.amount_original,
        "payment.details":
          `Customer Paid : ${req.body.amount_original} ${req.body.currency},` +
          ` Merchant will get : ${req.body.store_amount} ${req.body.currency}` +
          `at ${req.body.pay_time}`,

        "customerCharge.totalPayTk": req.body.amount_original,
        "customerCharge.remainingTkPay": 0,
      };
      payHisObj = {
        amount: req.body.amount_original,
        time: new Date().toISOString(),
      };
      // await async.parallel([
      //   async (cb) => {
      //     cb = await pgModel.create(req.body);
      //     return cb;
      //   },
      //   (cb) =>
      //     model
      //       .updateOne({ serialId }, { $set: orderModObj, $push: { paymentHistory: payHisObj } })
      //       .exec(cb),
      // ]);
    } else {
      if (req.query.status === "fail") {
        redirectUrl = `${protocol}${domain}/payment-failed/${serialId}`;
        orderModObj = {
          "onlinePayment.status": req.body.pay_status,
          "onlinePayment.failReason": req.body.reason,
        };
      } else {
        redirectUrl = `${protocol}${domain}/payment-cancelled/${serialId}`;
        orderModObj = {
          "onlinePayment.status": "Cancelled",
        };
      }
      // await async.parallel([
      //   async (cb) => {
      //     if (req.query.status === "fail") {
      //       cb = await pgModel.create(req.body);
      //       return cb;
      //     }
      //   },
      //   (cb) => model.updateOne({ serialId }, { $set: orderModObj }).exec(cb),
      // ]);
    }
    return res.redirect(redirectUrl);
  } catch (e) {
    console.log(e);
    return res.redirect(redirectUrl);
  }
};

module.exports = callback;
