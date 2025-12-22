// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const bkashSchema = new Schema(
    {
        isBkashActive: {
            type: Boolean,
            required: true
        },
        bkashAppKey: {
            type: String,
            required: true
        },
        bkashAppSecret: {
            type: String,
            required: true
        },
        bkashPassword: {
            type: String,
            required: true
        },
        bkashUsername: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("Bkash", bkashSchema);
