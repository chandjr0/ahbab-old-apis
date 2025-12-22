/**
 * Seed script to initialize the home collection with default data
 * Run with: node scripts/seedHome.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ahbab_local";

const homeSchema = new mongoose.Schema(
  {
    resellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reseller",
      index: true,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["web", "mobile"],
      index: true,
    },
    flashProduct: {
      type: "Boolean",
      default: true,
    },
    featureProducts: {
      type: "Boolean",
      default: true,
    },
    bestProducts: {
      type: "Boolean",
      default: true,
    },
    comboProducts: {
      type: "Boolean",
      default: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const HomeModel = mongoose.model("home", homeSchema);

async function seedHome() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if home documents already exist
    const existingWeb = await HomeModel.findOne({ deviceType: "web", resellerId: null });
    const existingMobile = await HomeModel.findOne({ deviceType: "mobile", resellerId: null });

    if (!existingWeb) {
      console.log("Creating home config for web...");
      await HomeModel.create({
        resellerId: null,
        deviceType: "web",
        flashProduct: true,
        featureProducts: true,
        bestProducts: true,
        comboProducts: true,
        categories: [],
      });
      console.log("Web home config created!");
    } else {
      console.log("Web home config already exists");
    }

    if (!existingMobile) {
      console.log("Creating home config for mobile...");
      await HomeModel.create({
        resellerId: null,
        deviceType: "mobile",
        flashProduct: true,
        featureProducts: true,
        bestProducts: true,
        comboProducts: true,
        categories: [],
      });
      console.log("Mobile home config created!");
    } else {
      console.log("Mobile home config already exists");
    }

    console.log("Home seed completed successfully!");
  } catch (err) {
    console.error("Error seeding home:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedHome();
