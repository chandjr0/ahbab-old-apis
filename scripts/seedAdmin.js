/**
 * Seed script to create the first admin user
 * Run with: node scripts/seedAdmin.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ahbab_local";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

const AdminModel = mongoose.model("admins", adminSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email: "admin@ahbab.com" });
    
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@ahbab.com");
      console.log("To reset password, use the forget password feature in admin panel.");
      await mongoose.disconnect();
      return;
    }

    // Default admin credentials
    const defaultEmail = "admin@ahbab.com";
    const defaultPhone = "01700000000";
    const defaultPassword = "admin123";

    // Hash password
    const hashPassword = await bcrypt.hash(defaultPassword, 12);
    
    if (!hashPassword) {
      throw new Error("Failed to hash password");
    }

    // Create admin user
    const adminData = await AdminModel.create({
      email: defaultEmail.toLowerCase(),
      phone: defaultPhone,
      password: hashPassword,
      role: "admin",
    });

    if (!adminData) {
      throw new Error("Failed to create admin user");
    }

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: admin@ahbab.com");
    console.log("🔑 Password: admin123");
    console.log("📱 Phone: 01700000000");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  IMPORTANT: Please change the password after first login!");
    
  } catch (err) {
    if (err.code === 11000) {
      console.log("Admin user already exists with this email or phone!");
    } else {
      console.error("Error seeding admin:", err);
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedAdmin();



