const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const smsSend = require("../../service/smsService");

const AdminModel = require("../../models/user/admin");
const EmployeeModel = require("../../models/user/employee");
const HoldAdminModel = require("../../models/user/holdAdmin");
// const OrderModel = require("../../models/order/order");
// const ProductModel = require("../../models/product/product");
// const AdminModel = require("../../models/user/customer");
// const ExpenseModel = require("../../models/expense/expense");
// const PurchaseModel = require("../../models/purchase/purchase");
const { validateEmail } = require("../../helpers/shareFunc");
const { resetMsg } = require("../../service/smsList");

const createAdmin = async (req, res) => {
  try {
    const checkEmailFormat = validateEmail(req.body.email);
    if (!checkEmailFormat) {
      return res.status(406).json({
        data: null,
        success: false,
        message: "Wrong email format!",
      });
    }

    const checkEmail = await AdminModel.findOne({
      email: { $regex: `^${req.body.email}$`, $options: "i" },
    });
    if (checkEmail) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Email already exist!",
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
    req.body.password = hashPassword;
    req.body.email = req.body.email.toLowerCase();
    const adminData = await AdminModel.create(req.body);

    if (!adminData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Admin couldn't be created!",
      });
    }

    return res.status(201).json({
      data: adminData,
      success: true,
      message: "Admin created successfully.",
    });
  } catch (err) {
    console.log("*** adminController: createAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const signIn = async (req, res) => {
  try {
    const [adminData, employeeData] = await Promise.all([
      AdminModel.findOne({ email: req.body.email }),
      EmployeeModel.findOne({ email: req.body.email }),
    ]);

    if (!adminData && !employeeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "User not found!",
      });
    }

    if (adminData) {
      const isEqual = await bcrypt.compare(req.body.password, adminData.password);
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
            _id: adminData._id,
            email: adminData.email,
            role: adminData.role,
          },
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.ADMIN_EXPIRE_TIME }
      );

      return res.status(200).json({
        data: {
          _id: adminData._id,
          email: adminData.email,
          role: adminData.role,
          token,
        },
        success: true,
        message: "Admin logged in Successful",
      });
    }
    const isEqual = await bcrypt.compare(req.body.password, employeeData.password);
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
          _id: employeeData._id,
          email: employeeData.email,
          name: employeeData.name,
          phone: employeeData.phone,
          role: employeeData.role,
          menuList: employeeData.menuList,
          orderStatusUpdate: employeeData.orderStatusUpdate,
        },
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.EMPLOYEE_EXPIRE_TIME }
    );

    return res.status(200).json({
      data: {
        _id: employeeData._id,
        email: employeeData.email,
        role: employeeData.role,
        menuList: employeeData.menuList,
        orderStatusUpdate: employeeData.orderStatusUpdate,
        token,
      },
      success: true,
      message: "Employee logged in Successful",
    });
  } catch (err) {
    console.log("*** adminController: signIn ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred!",
    });
  }
};

const adminUpdatePassword = async (req, res) => {
  try {
    const [adminData, employeeData] = await Promise.all([
      AdminModel.findOne({ _id: req.user._id }),
      EmployeeModel.findOne({ _id: req.user._id }),
    ]);

    if (!adminData && !employeeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "User not found!",
      });
    }

    if (adminData) {
      const isEqual = await bcrypt.compare(req.body.oldPassword, adminData.password);
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
      adminData.password = hashPassword;
      await adminData.save();

      if (!adminData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Password could not be updated",
        });
      }

      return res.status(200).json({
        data: adminData,
        success: true,
        message: "Password updated successfully.",
      });
    }
    const isEqual = await bcrypt.compare(req.body.oldPassword, employeeData.password);
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
    employeeData.password = hashPassword;
    await employeeData.save();

    if (!employeeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Password could not be updated",
      });
    }

    return res.status(200).json({
      data: employeeData,
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.log("*** adminController: adminUpdatePassword ***");
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
    const [checkAdmin, checkEmployee] = await Promise.all([
      AdminModel.findOne({
        phone: req.body.phone,
      }),
      EmployeeModel.findOne({
        phone: req.body.phone,
      }),
    ]);
    if (!checkAdmin && !checkEmployee) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "You are not register user!",
      });
    }

    let isAdmin = false;
    if (checkAdmin) {
      isAdmin = true;
    }

    // Check that you already send an otp
    const checkHoldData = await HoldAdminModel.findOne({ phone: req.body.phone });
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
      phone: req.body.phone,
      password: "",
      isAdmin,
    };

    const holdUserData = await HoldAdminModel.findOneAndUpdate(
      { phone: req.body.phone },
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
    console.log("*** adminController: otpForResetRequest ***");
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
    const holdUserData = await HoldAdminModel.findOne({
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
          isAdmin: holdUserData?.isAdmin,
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
    console.log("*** adminController: verifyOtpForResetPassword ***");
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

    let userData = null;
    if (decodeData?.data?.isAdmin) {
      userData = await AdminModel.findOneAndUpdate(
        { phone: decodeData?.data?.phone },
        {
          $set: {
            password: hashPassword,
          },
        },
        {
          new: true,
        }
      );
    } else {
      userData = await EmployeeModel.findOneAndUpdate(
        { phone: decodeData?.data?.phone },
        {
          $set: {
            password: hashPassword,
          },
        },
        {
          new: true,
        }
      );
    }

    await HoldAdminModel.findOneAndDelete({ _id: decodeData?.data?._id });

    if (!userData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Password couldn't be updated!",
      });
    }

    return res.status(201).json({
      data: userData,
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.log("*** adminController: resetPassword ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createAdmin,
  signIn,
  adminUpdatePassword,
  // dashboardOrderHistory,

  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,
};
