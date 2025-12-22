const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const objectId = require("mongoose").Types.ObjectId;

const { customAlphabet } = require("nanoid");
const ResellerModel = require("../../models/user/reseller");
const ResellerEmpModel = require("../../models/user/resellerEmployee");
const LogModel = require("../../models/helpers/log");

const customMetaData = require("../../helpers/customMetaData");
const uploadImage = require("../../utils/upload-img");
const { validateEmail } = require("../../helpers/shareFunc");

const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 20);
const customApiId = customAlphabet("abcdefghijklmnpqrstuvwxyz123456789", 20);
const updateSingleFile = require("../../utils/updateSingleImage");
const deleteFile = require("../../utils/delete-file");
// const ResellerApplicantModel = require("../../models/user/resellerApplicant");
const SettingsModel = require("../../models/settings/resellerSetting");
const HomeModel = require("../../models/home/home");
const HoldResellerModel = require("../../models/user/holdReseller");
const smsSend = require("../../service/smsService");
const { resetMsg, affiliateMsg } = require("../../service/smsList");

// ===================== visitor =========================
// submit reseller form by visitor
const submitResellerFromByVisitor = async (req, res) => {
  try {
    if (req.body.email !== "") {
      const checkEmailFormat = validateEmail(req.body.email.toLowerCase());
      if (!checkEmailFormat) {
        return res.status(406).json({
          data: null,
          success: false,
          message: "Wrong email format!",
        });
      }
    }

    // check phone email referid
    const exitReseller = await ResellerModel.findOne({
      $or: [
        {
          phone: req.body.phone,
        },
        {
          email: req.body.email.toLowerCase(),
        },
      ],
    });

    if (exitReseller) {
      return res.status(409).json({
        data: null,
        success: false,
        message:
          exitReseller?.phone === req.body.phone
            ? `Already phone number ${req.body.phone} used!`
            : `Already email number ${req.body.email.toLowerCase()} used!`,
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

    let imageUrl = "";
    if (req.body.image !== "") {
      imageUrl = uploadImage(req.body.image, "public/reseller/");
    }
    let nidImageUrl = "";
    if (req.body.nid.nidImage !== "") {
      nidImageUrl = uploadImage(req.body.nid.nidImage, "public/reseller/");
    }
    const legalDocsUrls = req.body.legalDocs.map((item) => uploadImage(item, "public/reseller/"));

    const obj = {
      serialId: customNanoId(8),
      apiKey: customApiId(24),
      referId: req.body.referId,
      commission: req.body.commission,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email.toLowerCase(),
      fbId: req.body.fbId,
      fbPageName: req.body.fbPageName,
      whatsAppNo: req.body.whatsAppNo,
      image: imageUrl,
      nid: {
        number: req.body.nid.number,
        nidImage: nidImageUrl,
      },
      address: {
        present: req.body.address.present,
        permanent: req.body.address.permanent,
        office: req.body.address.office,
      },
      legalDocs: legalDocsUrls,
      website: {
        domain: req.body.website.domain,
        url: req.body.website.url,
      },
      password: hashPassword,
    };

    const resellerData = await ResellerModel.create(obj);

    const logObj = {
      referObjectId: resellerData?._id,
      message: "Apply as a reseller by visitor",
      time: new Date().toISOString(),
    };

    await Promise.all([
      LogModel.create(logObj),
      SettingsModel.create({
        resellerId: resellerData?._id,
      }),
      HomeModel.create({
        resellerId: resellerData?._id,
      }),
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit form!",
      });
    }

    const message = affiliateMsg.registration;
    await smsSend(obj?.phone, message);

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "Submit form successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: addNewReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ===================== admin =========================
// create reseller
const addNewReseller = async (req, res) => {
  try {
    if (req.body.email !== "") {
      const checkEmailFormat = validateEmail(req.body.email.toLowerCase());
      if (!checkEmailFormat) {
        return res.status(406).json({
          data: null,
          success: false,
          message: "Wrong email format!",
        });
      }
    }

    // check phone email referid
    const exitReseller = await ResellerModel.findOne({
      $or: [
        {
          phone: req.body.phone,
        },
        {
          email: req.body.email.toLowerCase(),
        },
      ],
    });

    if (exitReseller) {
      return res.status(409).json({
        data: null,
        success: false,
        message:
          exitReseller?.phone === req.body.phone
            ? `Already phone number ${req.body.phone} used!`
            : `Already email number ${req.body.email.toLowerCase()} used!`,
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

    let imageUrl = "";
    if (req.body.image !== "") {
      imageUrl = uploadImage(req.body.image, "public/reseller/");
    }
    let nidImageUrl = "";
    if (req.body.nid.nidImage !== "") {
      nidImageUrl = uploadImage(req.body.nid.nidImage, "public/reseller/");
    }
    const legalDocsUrls = req.body.legalDocs.map((item) => uploadImage(item, "public/reseller/"));

    const obj = {
      serialId: customNanoId(8),
      apiKey: customApiId(24),
      referId: req.body.referId,
      commission: req.body.commission,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email.toLowerCase(),
      fbId: req.body.fbId,
      fbPageName: req.body.fbPageName,
      whatsAppNo: req.body.whatsAppNo,
      image: imageUrl,
      nid: {
        number: req.body.nid.number,
        nidImage: nidImageUrl,
      },
      address: {
        present: req.body.address.present,
        permanent: req.body.address.permanent,
        office: req.body.address.office,
      },
      legalDocs: legalDocsUrls,
      website: {
        domain: req.body.website.domain,
        url: req.body.website.url,
      },
      password: hashPassword,
      status: req.body.status,
      createdById: req.user._id,
      createdBy: req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`,
    };

    const resellerData = await ResellerModel.create(obj);

    const logObj = {
      referObjectId: resellerData?._id,
      message:
        req.user.role === "admin"
          ? "admin"
          : `${req.user.name}(${req.user.phone}) create the reseller.`,
      time: new Date().toISOString(),
    };

    await Promise.all([
      LogModel.create(logObj),
      SettingsModel.create({
        resellerId: resellerData?._id,
      }),
      HomeModel.create({
        resellerId: resellerData?._id,
      }),
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit form!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "Submit form successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: addNewReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// update reseller
const updateReseller = async (req, res) => {
  try {
    const checkReseller = await ResellerModel.findOne({
      _id: req.params.resellerId,
    });

    if (!checkReseller) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Reseller not found!",
      });
    }

    let hashPassword = "";
    if (req.body.password !== "") {
      hashPassword = await bcrypt.hash(req.body.password, 12);

      if (!hashPassword) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Something went wrong!",
        });
      }
    }

    const imageUrl = updateSingleFile(checkReseller?.image, req.body.image, "public/reseller/");
    const nidImageUrl = updateSingleFile(
      checkReseller?.nid?.nidImage,
      req.body.nid.nidImage,
      "public/reseller/"
    );

    const deletedImgList = [];

    const legalDocsUrls = req.body.legalDocs.map((img) => {
      const checkUrl = img.substring(0, 6);
      if (checkUrl !== "public") {
        return uploadImage(img, "public/reseller/");
      }
      return img;
    });

    // delete previous unused images
    checkReseller?.legalDocs.forEach((img) => {
      if (!legalDocsUrls.includes(img)) {
        deletedImgList.push(img);
      }
    });

    deletedImgList.forEach((item) => {
      deleteFile(item);
    });

    const obj = {
      referId: req.body.referId,
      commission: req.body.commission,
      name: req.body.name,
      fbId: req.body.fbId,
      fbPageName: req.body.fbPageName,
      whatsAppNo: req.body.whatsAppNo,
      image: imageUrl,
      nid: {
        number: req.body.nid.number,
        nidImage: nidImageUrl,
      },
      address: {
        present: req.body.address.present,
        permanent: req.body.address.permanent,
        office: req.body.address.office,
      },
      legalDocs: legalDocsUrls,
      website: {
        domain: req.body.website.domain,
        url: req.body.website.url,
      },
      status: req.body.status,
    };

    if (hashPassword !== "") {
      obj.password = hashPassword;
    }

    const message =
      req.user.role === "admin"
        ? "admin"
        : `${req.user.name}(${req.user.phone}) update the reseller. ${
            req.body.commission !== checkReseller?.commission &&
            `commission change from ${checkReseller?.commission} to ${req.body.commission}`
          }`;

    const logObj = {
      referObjectId: req.params.resellerId,
      message,
      time: new Date().toISOString(),
    };

    const [resellerData] = await Promise.all([
      ResellerModel.findOneAndUpdate(
        {
          _id: req.params.resellerId,
        },
        {
          $set: obj,
        },
        {
          new: true,
        }
      ),
      LogModel.create(logObj),
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "update successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: updateReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const listOfReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [];

    if (req.body.status !== "all") {
      matchCondition.push({
        status: req.body.status,
      });
    }

    if (req.body.value !== "") {
      matchCondition.push({
        $or: [
          {
            phone: { $regex: req.body.value, $options: "i" },
          },
          {
            email: { $regex: req.body.value, $options: "i" },
          },
          {
            serialId: { $regex: req.body.value, $options: "i" },
          },
        ],
      });
    }

    const [resellersData, totalData] = await Promise.all([
      ResellerModel.find(matchCondition.length > 0 ? { $and: matchCondition } : {})
        .sort({ createdAt: -1 })
        .limit(pageLimit)
        .skip((page - 1) * pageLimit),
      ResellerModel.countDocuments(matchCondition.length > 0 ? { $and: matchCondition } : {}),
    ]);

    if (!resellersData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit form!",
      });
    }

    return res.status(201).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellersData,
      success: true,
      message: "Submit form successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: listOfReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const searchReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [];

    if (req.body.value !== "") {
      matchCondition.push({
        $or: [
          {
            phone: { $regex: req.body.value, $options: "i" },
          },
          {
            email: { $regex: req.body.value, $options: "i" },
          },
          {
            serialId: { $regex: req.body.value, $options: "i" },
          },
        ],
      });
    }

    const [resellersData, totalData] = await Promise.all([
      ResellerModel.find(matchCondition.length > 0 ? { $and: matchCondition } : {}, {
        serialId: 1,
        phone: 1,
        email: 1,
        name: 1,
        image: 1,
      })
        .sort({ createdAt: -1 })
        .limit(pageLimit)
        .skip((page - 1) * pageLimit),
      ResellerModel.countDocuments(matchCondition.length > 0 ? { $and: matchCondition } : {}),
    ]);

    if (!resellersData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit form!",
      });
    }

    return res.status(201).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellersData,
      success: true,
      message: "Submit form successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: listOfReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const viewReseller = async (req, res) => {
  try {
    const [resellerData] = await ResellerModel.aggregate([
      {
        $match: {
          serialId: req.params.serialId,
        },
      },
      {
        $lookup: {
          from: "logs",
          let: { id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$referObjectId", "$$id"],
                },
              },
            },
            {
              $sort: {
                createdAt: 1,
              },
            },
            {
              $project: {
                message: 1,
                time: 1,
              },
            },
          ],
          as: "logs",
        },
      },
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "failed to view!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "View data successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: viewReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateResellerStatus = async (req, res) => {
  try {
    let sms = false;
    let smsMsg;
    const message =
      req.user.role === "admin"
        ? "admin"
        : `${req.user.name}(${req.user.phone}) update the reseller status (${req.body.status})!`;

    const logObj = {
      referObjectId: req.params.resellerId,
      message,
      time: new Date().toISOString(),
    };

    const prevData = await ResellerModel.aggregate([
      { $match: { _id: objectId(req.params.resellerId) } },
      { $project: { status: 1, _id: 0 } },
    ]);

    if (prevData.length === 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Reseller not found!",
      });
    }
    if (prevData[0].status === "pending") {
      smsMsg = affiliateMsg.regApprove;
      sms = true;
    }

    const [resellerData] = await Promise.all([
      ResellerModel.findOneAndUpdate(
        { _id: req.params.resellerId },
        {
          $set: {
            status: req.body.status,
          },
        },
        {
          new: true,
        }
      ),
      LogModel.create(logObj),
    ]);

    if (sms) {
      await smsSend(resellerData.phone, smsMsg);
    }

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to submit form!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "Submit form successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: updateResellerStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ===================== reseller =========================
const loginReseller = async (req, res) => {
  try {
    const [resellerData, resellerEmpData] = await Promise.all([
      ResellerModel.findOne({ $or: [{ phone: req.body.value }, { email: req.body.value }] }),
      ResellerEmpModel.aggregate([
        { $match: { $or: [{ phone: req.body.value }, { email: req.body.value }] } },
        { $project: { __v: 0 } },
        {
          $lookup: {
            from: "resellers",
            localField: "resellerId",
            foreignField: "_id",
            pipeline: [{ $project: { resId: "$_id", status: 1, _id: 0 } }],
            as: "resellerInfo",
          },
        },
      ]),
    ]);

    if (!resellerData && resellerEmpData.length === 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Reseller not found!",
      });
    }

    if (resellerData) {
      const isEqual = await bcrypt.compare(req.body.password, resellerData.password);
      if (!isEqual) {
        return res.status(409).json({
          data: null,
          success: false,
          message: "Incorrect Password!",
        });
      }

      if (["pending", "hold"].includes(resellerData?.status)) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "You are unable to login!",
        });
      }

      const token = jwt.sign(
        {
          data: {
            _id: resellerData._id,
            phone: resellerData.phone,
            email: resellerData.email,
            role: resellerData.role,
          },
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.RESELLER_EXPIRE_TIME }
      );

      return res.status(200).json({
        data: {
          _id: resellerData._id,
          phone: resellerData.phone,
          email: resellerData.email,
          role: resellerData.role,
          token,
        },
        success: true,
        message: "Reseller logged in Successful",
      });
    }
    const empData = resellerEmpData[0];
    const isEqual = await bcrypt.compare(req.body.password, empData.password);
    if (!isEqual) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Incorrect Password!",
      });
    }

    if (["pending", "hold"].includes(empData.resellerInfo[0]?.status)) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "You are unable to login!",
      });
    }

    const token = jwt.sign(
      {
        data: {
          // _id : here, _id is original resellerId
          _id: empData.resellerInfo[0]?.resId,
          // resEmployeeId : reseller employee Id
          resEmployeeId: empData._id,
          phone: empData.phone,
          email: empData.email,
          role: empData.role,
        },
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.RESELLER_EXPIRE_TIME }
    );

    return res.status(200).json({
      data: {
        _id: empData.resellerInfo[0]?.resId,
        resEmployeeId: empData._id,
        phone: empData.phone,
        email: empData.email,
        role: empData.role,
        menuList: empData.menuList,
        token,
      },
      success: true,
      message: "Reseller logged in Successful",
    });
  } catch (err) {
    console.log("*** resellerController: loginReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred!",
    });
  }
};

const viewResellerProfile = async (req, res) => {
  try {
    const resellerData = await ResellerModel.findOne({ _id: req.user._id });

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "failed to view!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "View data successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: viewResellerProfile ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updatePaymentDetails = async (req, res) => {
  try {
    const resellerData = await ResellerModel.findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          paymentDetails: req.body,
        },
      },
      {
        new: true,
      }
    );

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "failed to view!",
      });
    }

    return res.status(201).json({
      data: resellerData,
      success: true,
      message: "View data successfully.",
    });
  } catch (err) {
    console.log("*** resellerController: updatePaymentDetails ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerUpdatePassword = async (req, res) => {
  try {
    const [resellerData, employeeData] = await Promise.all([
      ResellerModel.findOne({ _id: req.user._id }),
      ResellerEmpModel.findOne({ _id: req.user?.resEmployeeId }),
    ]);

    if (!resellerData && !employeeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "User not found!",
      });
    }

    if (resellerData) {
      const isEqual = await bcrypt.compare(req.body.oldPassword, resellerData.password);
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
      resellerData.password = hashPassword;
      await resellerData.save();

      if (!resellerData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Password could not be updated",
        });
      }

      return res.status(200).json({
        data: resellerData,
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
    const checkReseller = await ResellerModel.findOne({
      phone: req.body.phone,
      status: "active",
    });

    if (!checkReseller) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "You are not active user!",
      });
    }

    // Check that you already send an otp
    const checkHoldData = await HoldResellerModel.findOne({ phone: req.body.phone });
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
    };

    const holdUserData = await HoldResellerModel.findOneAndUpdate(
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
    console.log("*** resellerController: otpForResetRequest ***");
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
    const holdUserData = await HoldResellerModel.findOne({
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
    console.log("*** resellerController: verifyOtpForResetPassword ***");
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

    const userData = await ResellerModel.findOneAndUpdate(
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

    await HoldResellerModel.findOneAndDelete({ _id: decodeData?.data?._id });

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
    console.log("*** resellerController: resetPassword ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // visitor
  submitResellerFromByVisitor,

  // admin
  addNewReseller,
  updateReseller,
  listOfReseller,
  searchReseller,
  viewReseller,
  updateResellerStatus,

  // reseller
  loginReseller,
  viewResellerProfile,
  updatePaymentDetails,
  resellerUpdatePassword,

  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,
};
