// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const onlinePaymentHistorySchema = new Schema(
    {
        paymentProvider: String, // BKash, SSL Commerz
        paymentStatus: String, // by ssl payment status
        transactionId: String, // payment transaction ID
        paymentID: String, // only for bkash
        paymentInfo: {}, // full response by ssl commerz
        status: String, // initial 1st, initial 2nd, initial 3rd, success, cancel, failed
        refundTransactionId: String // refund transaction ID
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("OnlinePaymentHistory", onlinePaymentHistorySchema);
