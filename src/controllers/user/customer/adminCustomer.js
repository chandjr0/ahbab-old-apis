const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const CustomerModel = require("../../../models/user/customer");
const HoldUserModel = require("../../../models/user/holdUser");
const OrderModel = require("../../../models/order/order");
const AdminOrderModel = require("../../../models/adminOrder/adminOrder");
const SmsModel = require("../../../models/user/sms");
const CustomerLoginVerificationModel = require("../../../models/user/customerLoginVerification");

const { customerLoginVerificationMsg } = require("../../../service/smsList");
const smsSend = require("../../../service/smsService");
const deleteFile = require("../../../utils/delete-file");
const updateSingleFile = require("../../../utils/updateSingleImage");

const pagination = require("../../../helpers/paginationQuery");

const { registrationMsg, resetMsg } = require("../../../service/smsList");
const customMetaData = require("../../../helpers/customMetaData");

const { adminCustomerProductCard } = require("../../../helpers/productAssists");

const productProjection = {
  name: 1,
  slug: 1,
  sku: 1,
  sticker: 1,
  galleryImage: 1,
  isFlashDeal: 1,
  isVariant: 1,
  nonVariation: {
    stock: 1,
    regularPrice: 1,
    sellingPrice: 1,
    discount: 1,
    flashPrice: 1,
  },
  variations: 1,
};

// DIRECT CUSTOMER REGISTRATION
const directCustomerRegistration = async (req, res) => {
  try {
    const checkPhone = await CustomerModel.findOne({
      resellerId: null,
      phone: req.body.phone,
    });
    if (checkPhone) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Phone already exist!",
      });
    }

    if (req.body.email) {
      const checkEmail = await CustomerModel.findOne({
        resellerId: null,
        email: req.body.email,
      });
      if (checkEmail) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Email already exist!",
        });
      }
    }

    const hashPassword = await bcrypt.hash(req.body.password, 12);
    if (!hashPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Something went wrong!",
      });
    }

    const obj = {
      userName: req.body.phone,
      phone: req.body.phone,
      email: req.body.email,
      password: hashPassword,
      name: req.body.name,
      resellerId: null,
    };

    const customerData = await CustomerModel.create(obj);

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Customer couldn't be created!",
      });
    }

    return res.status(201).json({
      data: customerData,
      success: true,
      message: "Customer created successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: otpVerifyForRegistration ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// CUSTOMER REGISTRATION
const customerRegistration = async (req, res) => {
  try {
    const checkPhone = await CustomerModel.findOne({
      resellerId: null,
      phone: { $regex: `^${req.body.phone}$`, $options: "i" },
    });
    if (checkPhone) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Phone already exist!",
      });
    }

    // Check that you already send an otp
    const checkHoldData = await HoldUserModel.findOne({ resellerId: null, phone: req.body.phone });
    if (checkHoldData) {
      const codeExpireTime =
        new Date(checkHoldData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; // min
      const currentTime = new Date().getTime();
      if (codeExpireTime >= currentTime) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "We already send an otp to your phone!",
        });
      }
    }

    const hashPassword = await bcrypt.hash(req.body.password, 12);
    if (!hashPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Something went wrong!",
      });
    }

    const nanoid = customAlphabet("1234567890", 6);
    const otpCode = nanoid(6); // in future make a while loop check the otp exit already

    const obj = {
      otpCode,
      name: req.body.name,
      phone: req.body.phone,
      password: hashPassword,
      resellerId: null,
    };

    const holdUserData = await HoldUserModel.findOneAndUpdate(
      { resellerId: null, phone: req.body.phone },
      {
        $set: obj,
      },
      {
        upsert: true,
        new: true,
      }
    );

    if (!holdUserData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to register Customer. Try again!",
      });
    }

    // send SMS
    await smsSend(req.body.phone, registrationMsg(otpCode));

    return res.status(201).json({
      data: null,
      success: true,
      message: "An otp send to your phone",
    });
  } catch (err) {
    console.log("*** adminCustomer: customerRegistration ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// OTP VERIFY FOR REGISTRATION
const otpVerifyForRegistration = async (req, res) => {
  try {
    const holdUserData = await HoldUserModel.findOne({
      resellerId: null,
      otpCode: req.body.otpCode,
    });

    if (!holdUserData) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6 digit OTP received in your Phone",
      });
    }

    const codeExpireTime =
      new Date(holdUserData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; // min
    const currentTime = new Date().getTime();

    if (codeExpireTime < currentTime) {
      await holdUserData.remove();

      return res.status(400).json({
        data: null,
        success: false,
        message: "The Verification Code has expired!!",
      });
    }

    const obj = {
      userName: holdUserData?.phone,
      phone: holdUserData?.phone,
      password: holdUserData?.password,
      name: holdUserData?.name,
      resellerId: null,
    };

    const customerData = await CustomerModel.create(obj);

    await holdUserData.remove();

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Customer couldn't be created!",
      });
    }

    return res.status(201).json({
      data: customerData,
      success: true,
      message: "Customer created successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: otpVerifyForRegistration ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// OTP FOR RESET REQUEST
const otpForResetRequest = async (req, res) => {
  try {
    const checkPhone = await CustomerModel.findOne({
      phone: req.body.phone,
      resellerId: null,
    });
    if (!checkPhone) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "You are not register user!",
      });
    }

    // Check that you already send an otp
    const checkHoldData = await HoldUserModel.findOne({ resellerId: null, phone: req.body.phone });
    if (checkHoldData) {
      const codeExpireTime =
        new Date(checkHoldData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; // min
      const currentTime = new Date().getTime();
      if (codeExpireTime >= currentTime) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "We already send an otp to your phone!",
        });
      }
    }

    const nanoid = customAlphabet("1234567890", 6);
    const otpCode = nanoid(6); // in future make a while loop check the otp exit already

    const obj = {
      otpCode,
      name: "",
      phone: req.body.phone,
      password: "",
      resellerId: null,
    };

    const holdUserData = await HoldUserModel.findOneAndUpdate(
      { resellerId: null, phone: req.body.phone },
      {
        $set: obj,
      },
      {
        upsert: true,
        new: true,
      }
    );

    if (!holdUserData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to reset password. Try again!",
      });
    }

    // send SMS
    await smsSend(req.body.phone, resetMsg(otpCode));

    return res.status(201).json({
      data: null,
      success: true,
      message: "An otp send to your phone",
    });
  } catch (err) {
    console.log("*** adminCustomer: otpForResetRequest ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// VERIFY OTP FOR RESET PASSWORD
const verifyOtpForResetPassword = async (req, res) => {
  try {
    const holdUserData = await HoldUserModel.findOne({
      resellerId: null,
      otpCode: req.body.otpCode,
    });

    if (!holdUserData) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6 digit OTP received in your Phone",
      });
    }

    const codeExpireTime =
      new Date(holdUserData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; //  minutes
    const currentTime = new Date().getTime();

    if (codeExpireTime < currentTime) {
      await holdUserData.remove();

      return res.status(400).json({
        data: null,
        success: false,
        message: "The Verification Code has expired!!",
      });
    }

    const token = jwt.sign(
      {
        data: {
          _id: holdUserData?._id,
          phone: holdUserData?.phone,
          resellerId: null,
        },
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "300s" } // 5min
    );

    return res.status(201).json({
      token,
      success: true,
      message: "verify otp successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: verifyOtpForResetPassword ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    let decodeData = null;
    try {
      decodeData = await jwt.verify(req.body.token, process.env.TOKEN_SECRET);
    } catch (err) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Token invalid. Try from start!",
      });
    }

    if (!decodeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Token invalid. Try from start!",
      });
    }

    const hashPassword = await bcrypt.hash(req.body.password, 12);
    if (!hashPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Something went wrong!",
      });
    }

    const customerData = await CustomerModel.findOneAndUpdate(
      { resellerId: null, userName: decodeData?.data?.phone },
      {
        $set: {
          password: hashPassword,
        },
      },
      {
        new: true,
      }
    );

    await HoldUserModel.findOneAndDelete({ _id: decodeData?.data?._id });

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Password couldn't be updated!",
      });
    }

    return res.status(201).json({
      data: customerData,
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: resetPassword ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// LOGIN CUSTOMER
const loginCustomer = async (req, res) => {
  try {
    const customerData = await CustomerModel.findOne({ phone: req.body.phone, resellerId: null });
    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Customer not found!",
      });
    }

    const isEqual = await bcrypt.compare(req.body.password, customerData.password);
    if (!isEqual) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Incorrect Password!",
      });
    }

    const token = jwt.sign(
      {
        data: {
          _id: customerData._id,
          phone: customerData.phone,
          role: customerData.role,
        },
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.CUSTOMER_EXPIRE_TIME }
    );

    return res.status(200).json({
      data: {
        _id: customerData._id,
        phone: customerData.phone,
        role: customerData.role,
        token,
      },
      success: true,
      message: "Customer logged in Successful",
    });
  } catch (err) {
    console.log("*** adminCustomer: loginCustomer ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred!",
    });
  }
};

const loginOtpSend = async (req, res) => {
  try {
    const checkVerifyData = await CustomerLoginVerificationModel.findOne({ phone: req.body.phone });
    if (checkVerifyData) {
      const codeExpireTime = new Date(checkVerifyData.updatedAt).getTime() + Number(process.env.OTP_TIME) * 60 * 1000; // min
      const currentTime = new Date().getTime();
      if (codeExpireTime >= currentTime) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Already send an otp to your phone!",
        });
      }
  
      const nanoid = customAlphabet("1234567890", 6);
      const otpCode = nanoid(6);  
      await CustomerLoginVerificationModel.findOneAndUpdate({phone: req.body.phone}, {$set: {otpCode: otpCode}});
  
      await smsSend(req.body.phone, customerLoginVerificationMsg(otpCode));
  
      return res.status(201).json({
        data: '',
        success: true,
        message: "OTP send to your phone",
      });
    } else {
      const nanoid = customAlphabet("1234567890", 6);
      const otpCode = nanoid(6); 
       
      await CustomerLoginVerificationModel.create({
        phone: req.body.phone,
        otpCode
      })
  
      await smsSend(req.body.phone, customerLoginVerificationMsg(otpCode));
  
      return res.status(201).json({
        data: '',
        success: true,
        message: "Otp send to your phone!",
      });
    }
  }
  catch(error) {
    console.log('orderOtpSend error ', error);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
}

const loginOtpVerify = async (req, res) => {
  try {
    const checkVerifyData = await CustomerLoginVerificationModel.findOne({ phone: req.body.phone, otpCode: req.body.otpCode });
    if (!checkVerifyData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "OTP didn't match!",
      });
    }
    const customerData = await CustomerModel.findOne({ phone: req.body.phone });
    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "User not found!",
      });
    }

    const token = jwt.sign(
      {
        data: {
          _id: customerData._id,
          phone: customerData.phone,
          role: customerData.role,
        },
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.CUSTOMER_EXPIRE_TIME }
    );

    await CustomerLoginVerificationModel.findOneAndDelete({phone: req.body.phone, otpCode: req.body.otpCode});
    return res.status(200).json({
      data: {
        _id: customerData?._id,
        name: customerData?.name,
        image: customerData?.image,
        phone: customerData?.phone,
        token,
      },
      success: true,
      message: "OTP verify success!",
    });
  }
  catch(error) {
    console.log('loginOtpVerify error ', error);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
}

//  UPDATE CUSTOMER INFORMATION
const updateInformation = async (req, res) => {
  try {
    const prevCustomerData = await CustomerModel.findOne({ resellerId: null, _id: req.user._id });
    if (!prevCustomerData) {
      res.status(409).json({
        data: null,
        success: false,
        message: "customer not found!",
      });
    }

    req.body.image = updateSingleFile(prevCustomerData?.image, req.body.image, "public/user/");

    if (prevCustomerData?.image !== req.body.image) {
      deleteFile(prevCustomerData?.image);
    }

    const customerData = await CustomerModel.findOneAndUpdate(
      { resellerId: null, _id: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!customerData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Profile couldn't updated!",
      });
    }

    return res.status(200).json({
      data: customerData,
      success: true,
      message: "Profile updated!",
    });
  } catch (err) {
    console.log("*** adminCustomer: updateInformation ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// PROFILE VIEW
const profileView = async (req, res) => {
  try {
    const customerData = await CustomerModel.findOne(
      { resellerId: null, _id: req.user._id },
      { password: 0 }
    );

    if (customerData) {
      res.status(200).json({
        data: customerData,
        success: true,
        message: "Customer profile view successfully.",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Customer not found!",
      });
    }
  } catch (err) {
    console.log("*** adminCustomer: profileView ***");
    console.log("ERROR:", err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// Product insert into --> wish list [Single Product]
const wishListInsert = async (req, res) => {
  try {
    const updatedCustomer = await CustomerModel.findOneAndUpdate(
      { resellerId: null, _id: req.user._id },
      { $addToSet: { wishList: req.params.productId } },
      { new: true }
    );
    if (updatedCustomer) {
      res.status(201).json({
        data: updatedCustomer,
        success: true,
        message: "Product added to wishlist successfully",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Product could not be added to wishlist successfully",
      });
    }
  } catch (err) {
    console.log("*** adminCustomer: wishListInsert ***");
    console.log("ERROR:", err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// Product delete from wishlist [Single Product]
const wishListRemove = async (req, res) => {
  try {
    const updatedCustomerAfterRemove = await CustomerModel.findOneAndUpdate(
      { resellerId: null, _id: req.user._id },
      { $pull: { wishList: req.params.productId } },
      { new: true }
    );
    if (updatedCustomerAfterRemove) {
      res.status(201).json({
        data: updatedCustomerAfterRemove,
        success: true,
        message: "Product removed from wishlist successfully",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Product couldn't be removed from wishlist",
      });
    }
  } catch (err) {
    console.log("*** adminCustomer: wishListRemove ***");
    console.log("ERROR:", err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// Fetch Customer WishList
const wishListFetch = async (req, res) => {
  try {
    const [customerData] = await CustomerModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.user._id),
        },
      },
      {
        $project: {
          wishList: 1,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "wishList",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $and: [{ isDeleted: { $eq: false } }, { isOwnDisabled: { $eq: false } }],
              },
            },
            ...adminCustomerProductCard,
            {
              $project: productProjection,
            },
          ],
          as: "wishList",
        },
      },
    ]);

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch wish-list",
      });
    }
    return res.status(200).json({
      data: customerData?.wishList,
      success: true,
      message: "Wish List Product!",
    });
  } catch (err) {
    console.log("*** adminCustomer: wishListFetch ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const customerUpdatePassword = async (req, res) => {
  try {
    const userData = await CustomerModel.findOne({ resellerId: null, _id: req.user._id });
    if (!userData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Admin not found!",
      });
    }

    const isEqual = await bcrypt.compare(req.body.oldPassword, userData.password);
    if (!isEqual) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Old password didn't match!.",
      });
    }

    const hashPassword = await bcrypt.hash(req.body.newPassword, 12);
    if (!hashPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Something went wrong!",
      });
    }
    userData.password = hashPassword;
    await userData.save();

    if (!userData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Password could not be updated",
      });
    }

    return res.status(200).json({
      data: userData,
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.log("*** adminController: customerUpdatePassword ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//= ==================== ADMIN START ==========================
// FETCH ALL CUSTOMER BY ADMIN
const allCustomers = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      resellerId: null,
    };

    const [customerData, totalData] = await Promise.all([
      CustomerModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: { password: 0, wishList: 0 },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      CustomerModel.countDocuments(matchCondition),
    ]);

    if (!customerData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Data not found!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: customerData,
      success: true,
      message: "Fetch All Customers",
    });
  } catch (err) {
    console.log("*** adminCustomer: allCustomers ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchAllCustomerList = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};
    if (req.body.startTime && req.body.endTime) {
      matchCondition = {
        createdAt: {
          $gte: new Date(req.body.startTime),
          $lte: new Date(req.body.endTime),
        },
      };
    }

    if (req.body.value) {
      matchCondition = {
        ...matchCondition,
        $or: [
          { "deliveryAddress.name": { $regex: req.body.value, $options: "i" } },
          { "deliveryAddress.address": { $regex: req.body.value, $options: "i" } },
          { "deliveryAddress.phone": { $regex: req.body.value, $options: "i" } },
        ],
      };
    }

    // sortBy =  orderNum, price
    let sortCondition = {
      tOrder: -1,
    };
    if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [customerData, [{ totalData } = {}]] = await Promise.all([
      AdminOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            customerId: 1,
            customerCharge: 1,
            status: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: {
              customerId: "$customerId",
              status: "$status",
            },
            tOrder: { $sum: 1 },
            tPrice: { $sum: "$customerCharge.totalBill" },
          },
        },
        {
          $group: {
            _id: "$_id.customerId",
            tOrder: { $sum: "$tOrder" },
            tPrice: { $sum: "$tPrice" },
            ordersByStatus: {
              $push: {
                status: "$_id.status",
                tOrder: "$tOrder",
                tPrice: "$tPrice",
              },
            },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  phone: 1,
                  address: 1,
                  image: 1,
                },
              },
            ],
            as: "customerData",
          },
        },
        {
          $unwind: {
            path: "$customerData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      AdminOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            customerId: 1,
            customerCharge: 1,
            status: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: {
              customerId: "$customerId",
              status: "$status",
            },
            tOrder: { $sum: 1 },
            tPrice: { $sum: "$customerCharge.totalBill" },
          },
        },
        {
          $group: {
            _id: "$_id.customerId",
            tOrder: { $sum: "$tOrder" },
            tPrice: { $sum: "$tPrice" },
            ordersByStatus: {
              $push: {
                status: "$_id.status",
                tOrder: "$tOrder",
                tPrice: "$tPrice",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: customerData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** adminCustomer: fetchAllCustomerList ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE CUSTOMER BY ADMIN
const singleCustomer = async (req, res) => {
  try {
    const customerData = await CustomerModel.findOne(
      { _id: req.params.customerId, resellerId: null },
      { wishList: 0, password: 0 }
    );
    if (customerData) {
      res.status(200).json({
        data: customerData,
        success: true,
        message: "Fetch single customer",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Data not found!",
      });
    }
  } catch (err) {
    console.log("*** adminCustomer: singleCustomer ***");
    console.log("ERROR:", err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH CUSTOMER BY PHONE
const fetchCustomersByPhone = async (req, res) => {
  try {
    const customerData = await CustomerModel.findOne({
      phone: req.body.phone,
      resellerId: null,
    });

    if (!customerData) {
      return res.status(200).json({
        data: null,
        success: false,
        message: "Customer not found!",
      });
    }

    return res.status(200).json({
      data: customerData,
      success: true,
      message: "Fetch customer successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: fetchCustomersByPhone ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchCustomersByPhoneOrName = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $and: [
        {
          resellerId: null,
        },
        {
          $or: [
            {
              phone: { $regex: req.body.value, $options: "i" },
            },
            {
              name: { $regex: req.body.value, $options: "i" },
            },
          ],
        },
      ],
    };

    const [customerData, totalData] = await Promise.all([
      CustomerModel.find(matchCondition)
        .sort({ createdAt: -1 })
        .limit(pageLimit)
        .skip((page - 1) * pageLimit),
      CustomerModel.countDocuments(matchCondition),
    ]);

    if (!customerData) {
      return res.status(200).json({
        data: null,
        success: false,
        message: "Customer not found!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: customerData,
      success: true,
      message: "Fetch customer successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: fetchCustomersByPhoneOrName ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SINGLE CUSTOMER ORDER DETAILS
const singleCustomerOrderDetails = async (req, res) => {
  try {
    const orderData = await OrderModel.aggregate([
      {
        $match: {
          customerId: ObjectId(req.params.customerId),
        },
      },
      {
        $project: {
          products: 1,
          customerCharge: 1,
          currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
          currentStatusTime: { $arrayElemAt: ["$orderStatus.time", -1] },
        },
      },
      {
        $group: {
          _id: "$currentStatus",
          order: { $sum: 1 },
          price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
        },
      },
      {
        $project: {
          status: "$_id",
          order: 1,
          price: 1,
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single customer order",
      });
    }

    const updateOrderData = [];
    [
      "PENDING",
      "HOLD",
      "CONFIRM",
      "PROCESSING",
      "PICKED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
      "REFUND",
      "CANCELED",
    ].forEach((s) => {
      const existData = orderData.find((d) => d?.status === s);
      if (existData) {
        updateOrderData.push(existData);
      }
    });

    return res.status(201).json({
      data: updateOrderData,
      success: true,
      message: "Customer order data fetch successfully.",
    });
  } catch (err) {
    console.log("*** adminCustomer: singleCustomerOrderDetails ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//= ==================== ADMIN END ==========================

//= ==================== BULK SMS ==========================
// FETCH ALL CUSTOMER
const allCustomersNumber = async (req, res) => {
  try {
    const customerData = await CustomerModel.find({ resellerId: null }, { phone: 1 });

    if (!customerData) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Data not found!",
      });
    }

    return res.status(200).json({
      data: customerData,
      success: true,
      message: "Fetch All Customers Number",
    });
  } catch (err) {
    console.log("*** adminCustomer: allCustomers ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// PROMOTIONAL SMS
const promotionalBulkSms = async (req, res) => {
  try {
    try {
      await Promise.all(req.body.numbers.map((phn) => smsSend(phn, req.body.message)));
    } catch (err) {
      return res.status(426).json({
        data: null,
        success: false,
        message: err?.message,
      });
    }

    return res.status(201).json({
      data: null,
      success: true,
      message: "Bulk message send to all User",
    });
  } catch (err) {
    console.log("*** adminCustomer: promotionalBulkSms ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SMS LIST
const fetchSmsList = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const smsData = await SmsModel.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (!smsData[0]?.data) {
      return res.status(402).json({
        data: null,
        success: false,
        message: "Data not found!",
      });
    }

    return res.status(201).json({
      metaData: smsData[0]?.metadata[0] ? smsData[0]?.metadata[0] : [],
      data: smsData[0]?.data ? smsData[0]?.data : [],
      success: true,
      message: "Bulk message send to all User",
    });
  } catch (err) {
    console.log("*** adminCustomer: promotionalBulkSms ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // customer
  directCustomerRegistration,
  customerRegistration,
  otpVerifyForRegistration,
  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,

  loginCustomer,
  loginOtpSend,
  loginOtpVerify,
  updateInformation,
  profileView,
  customerUpdatePassword,

  wishListInsert,
  wishListRemove,
  wishListFetch,

  // admin
  allCustomers,
  fetchAllCustomerList,
  singleCustomer,
  singleCustomerOrderDetails,
  fetchCustomersByPhone,
  fetchCustomersByPhoneOrName,

  // bulk msg
  allCustomersNumber,
  promotionalBulkSms,
  fetchSmsList,
};
