const bcrypt = require("bcryptjs");
const objectId = require("mongoose").Types.ObjectId;

const AdminModel = require("../../models/user/reseller");
const EmployeeModel = require("../../models/user/resellerEmployee");
const uploadImage = require("../../utils/upload-img");
// const deleteFile = require("../../utils/delete-file");
const { validateEmail } = require("../../helpers/shareFunc");
const updateSingleFile = require("../../utils/updateSingleImage");

const employeeCreate = async (req, res) => {
  try {
    const checkEmailFormat = validateEmail(req.body.email);
    if (!checkEmailFormat) {
      return res.status(406).json({
        data: null,
        success: false,
        message: "Wrong email format!",
      });
    }

    const adminCheck = await AdminModel.findOne({
      $or: [
        {
          email: req.body.email,
        },
        {
          phone: req.body.phone,
        },
      ],
    });
    const employeeCheck = await EmployeeModel.findOne({
      $or: [
        {
          email: req.body.email,
        },
        {
          phone: req.body.phone,
        },
      ],
    });

    if (adminCheck || employeeCheck) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Email/Phone address already use!",
      });
    }

    if (req.body.image) {
      req.body.image = uploadImage(req.body.image, "public/employee/");
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
    req.body.resellerId = req.user._id;

    const employeeData = await EmployeeModel.create(req.body);

    if (!employeeData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Employee couldn't be created!",
      });
    }

    return res.status(201).json({
      data: employeeData,
      success: true,
      message: "Employee created successfully.",
    });
  } catch (err) {
    console.log("*** employeeController: employeeCreate ***");
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const employeeUpdate = async (req, res) => {
  try {
    const checkUser = await EmployeeModel.findOne({
      _id: req.params.employeeId,
    });

    if (!checkUser) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "employee not found!",
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

    const imageUrl = updateSingleFile(checkUser?.image, req.body.image, "public/employee/");

    const obj = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: hashPassword,
      image: imageUrl,
      isDisabled: req.body.isDisabled,
    };

    if (hashPassword !== "") {
      obj.password = hashPassword;
    }

    const userData = await EmployeeModel.findOneAndUpdate(
      {
        _id: req.params.employeeId,
      },
      {
        $set: obj,
      },
      {
        new: true,
      }
    );

    if (!userData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update!",
      });
    }

    return res.status(201).json({
      data: userData,
      success: true,
      message: "update successfully.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const singleEmployee = async (req, res) => {
  try {
    const employeeData = await EmployeeModel.findOne({ _id: req.params.employeeId });

    if (employeeData) {
      res.status(200).json({
        data: employeeData,
        success: true,
        message: "Employee View.",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Failed to Employee View.",
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const allEmployeeList = async (req, res) => {
  try {
    let criteria;
    if (req.user.role === "reseller") {
      criteria = { resellerId: objectId(req.user._id) };
    } else {
      criteria = { resellerId: objectId(req.user.resEmployeeId) };
    }

    const employeeData = await EmployeeModel.find(criteria, { menuList: 0 });

    if (employeeData) {
      res.status(200).json({
        data: employeeData,
        success: true,
        message: "All Employee View.",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Failed to all Employee View!",
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const employeeDelete = async (req, res) => {
  try {
    const employeeData = await EmployeeModel.findOneAndDelete({ _id: req.params.employeeId });

    if (employeeData) {
      res.status(202).json({
        data: employeeData,
        success: true,
        message: "Employee deleted successfully",
      });
    } else {
      res.status(409).json({
        success: false,
        message: "Couldn't delete employee!",
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const employeeActivateDeactivate = async (req, res) => {
  try {
    const employeeData = await EmployeeModel.findOneAndUpdate(
      { _id: req.params.employeeId },
      { $set: { isDisabled: req.query.isDisabled } }
    );

    if (employeeData) {
      res.status(200).json({
        data: employeeData,
        success: true,
        message: `Employee ${employeeData?.isDisabled ? "enable" : "disabled"} Successfully.`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Employee could not be updated!`,
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const associateMenuToEmployee = async (req, res) => {
  try {
    const employeeData = await EmployeeModel.findOneAndUpdate(
      { _id: req.body.employeeId },
      { $set: { menuList: req.body.menuList } },
      { new: true }
    );

    if (employeeData) {
      res.status(200).json({
        data: employeeData,
        success: true,
        message: "update menulist successfully.",
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Failed to update menulist!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  employeeCreate,
  employeeUpdate,
  singleEmployee,
  allEmployeeList,
  employeeActivateDeactivate,
  employeeDelete,
  associateMenuToEmployee,
};
