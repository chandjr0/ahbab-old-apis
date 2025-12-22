// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const onlineOrderFakeSchema = new Schema(
    {
        customerId: String,
        products: [{
            productId: String,
            isVariant: Boolean,
            quantity: Number,
            price: Number,
            variationId: String,
            variationName: String
        }],
        combos: [],
        promo: String,
        customerNote: String,
        deliveryType: String,
        paymentAmount: Number,
        payment: {
            paymentType: String,
            amount: Number,
            details: String,
            documentImg: String
        },
        onlinePaymentReq: Boolean,
        host: String,
        customerCharge: {
            totalProductPrice: Number,
            discountPrice: Number, 
            deliveryCharge: Number,
            totalPayTk: Number
        },
        deliveryAddress: {
            name: String,
            phone: String,
            cityId: String,
            zoneId: String,
            address: String
        },
        tran_id: String,
        paymentID: String,
        reqUser: {},
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("OnlineOrderFake", onlineOrderFakeSchema);
