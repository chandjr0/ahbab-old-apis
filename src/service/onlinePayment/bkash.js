const bKashModel = require("../../models/onlinePayment/bkash");
const { authHeader, bkashRefund } = require("../../helpers/bkash");

const refundBkashOrder = async (refundBkashOrderDto) => {
    try {
        const refundPayload = {
            amount: refundBkashOrderDto.amount,
            paymentID: refundBkashOrderDto.paymentID,
            trxID: refundBkashOrderDto.trxID,
            sku: refundBkashOrderDto?.sku || "",
            reason: refundBkashOrderDto?.reason || "",
        }
        const { bkashAppKey, bkashAppSecret, bkashPassword, bkashUsername } = await bKashModel.findOne({});

        const bkashUrl = `https://tokenized${process.env.NODE_ENV === "dev" ? ".sandbox" : ".pay"}.bka.sh/v1.2.0-beta`;
        const bkashConfigObj = { bkashAppKey, bkashAppSecret, bkashPassword,  bkashUsername, bkashUrl };

        const authHeaders = await authHeader(bkashConfigObj);
        const refundResponse = await bkashRefund(refundPayload, authHeaders, bkashConfigObj);
        return refundResponse;
    } catch (error) {
        console.log("bkash refundBkashOrder error ============== ", error);
        return null;
    }
}

module.exports = {
    refundBkashOrder
}