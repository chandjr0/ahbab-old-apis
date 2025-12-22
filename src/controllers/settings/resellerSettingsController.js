const AdminSettingsModel = require("../../models/settings/setting");
const SettingsModel = require("../../models/settings/resellerSetting");
const ResellerModel = require("../../models/user/reseller");
const CategoryModel = require("../../models/product/category");
const FlashProductModel = require("../../models/product/flashDealProduct");
const StaticPaymentModel = require("../../models/settings/staticPayment");

const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");
const updateSingleFile = require("../../utils/updateSingleImage");

const { nestedCategories } = require("../../helpers/productAssists");

// FETCH SETTINGS VIEW
const fetchSetting = async (req, res) => {
  try {
    const [settingsData, adminSettingsData] = await Promise.all([
      SettingsModel.findOne(
        {
          resellerId: req.user._id,
        },
        { pages: 0, resellerId: 0 }
      ).lean(),
      AdminSettingsModel.findOne(
        {},
        {
          deliveryCharge: 1,
          isPromoHide: 1,
          isOnlinePayHide: 1,
        }
      ).lean(),
    ]);

    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch settings data!",
        success: true,
      });
    }

    res.status(201).json({
      data: {
        ...settingsData,
        deliveryCharge: adminSettingsData?.deliveryCharge,
        isPromoHide: adminSettingsData?.isPromoHide,
        isOnlinePayHide: adminSettingsData?.isOnlinePayHide,
      },
      message: "fetch settings data successfully!",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE BASIC SETTINGS
const updateBasicSetting = async (req, res) => {
  try {
    const oldSettingsData = await SettingsModel.findOne({ resellerId: req.user._id });

    req.body.logoImg = updateSingleFile(
      oldSettingsData?.logoImg,
      req.body.logoImg,
      "public/settings/"
    );

    req.body.favIcon = updateSingleFile(
      oldSettingsData?.favIcon,
      req.body.favIcon,
      "public/settings/",
      "ico"
    );

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    await ResellerModel.findOneAndUpdate({_id: req.user._id}, {$set: {
      logoImg: settingsData?.logoImg,
      generalSettingPhone: settingsData?.phone
    }});

    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to update settings data!",
        success: true,
      });
    }

    res.status(200).json({
      data: null,
      message: "Update settings data successfully!",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SETTINGS PAGES VIEW
const fetchSettingPages = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne({ resellerId: req.user._id }, { pages: 1 });

    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch settings pages data!",
        success: true,
      });
    }

    res.status(201).json({
      data: settingsData,
      message: "fetch settings pages data successfully!",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE PAGES SETTING
const updatePagesSetting = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to update settings pages!",
        success: true,
      });
    }

    res.status(200).json({
      data: null,
      message: "Update settings pages successfully!",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE dELIVERY CHARGE
const updateDeliveryCharge = async (req, res) => {
  try {
    const obj = {
      deliveryCharge: {
        inside: {
          d_type: "INSIDE",
          amount: req.body.inside,
        },
        outside: {
          d_type: "OUTSIDE",
          amount: req.body.outside,
        },
        miniDetails: req.body.miniDetails,
        midDescription: req.body.midDescription,
        longDescription: req.body.longDescription,
      },
    };

    const updateData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: obj,
      }
    );
    const data = await SettingsModel.findOne(
      { resellerId: req.user._id },
      {
        deliveryCharge: 1,
        deliveryChargeDetails: 1,
      }
    );
    if (updateData) {
      res.status(200).json({
        data,
        success: true,
        message: "Update Successfully.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Could not be updated!",
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

// UPLOAD SLIDER IMAGE
const uploadSliderImage = async (req, res) => {
  try {
    req.body.image = uploadImage(req.body.image, "public/settings/");

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $push: {
          sliderImgs: {
            image: req.body.image,
            url: req.body.url,
          },
        },
      },
      {
        new: true,
      }
    );

    if (settingsData) {
      res.status(200).json({
        data: settingsData.sliderImgs,
        success: true,
        message: "Update Successfully.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Could not be updated!",
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

// DELETE SLIDER IMAGE
const deleteSliderImage = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $pull: {
          sliderImgs: { _id: req.body._id },
        },
      },
      {
        new: true,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be deleted!",
      });
    }

    // remove image
    deleteFile(req.body.image);

    return res.status(200).json({
      data: settingsData.sliderImgs,
      success: true,
      message: "Deleted Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPLOAD BRAND IMAGE
const uploadBrandImage = async (req, res) => {
  try {
    req.body.image = uploadImage(req.body.image, "public/settings/");

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $push: {
          brandImgs: {
            image: req.body.image,
            url: req.body.url,
          },
        },
      },
      {
        new: true,
      }
    );

    if (settingsData) {
      res.status(200).json({
        data: settingsData.brandImgs,
        success: true,
        message: "Update Successfully.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Could not be updated!",
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

// DELETE BRAND IMAGE
const deleteBrandImage = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $pull: {
          brandImgs: { _id: req.body._id },
        },
      },
      {
        new: true,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be deleted!",
      });
    }

    // remove image
    deleteFile(req.body.image);

    return res.status(200).json({
      data: settingsData.brandImgs,
      success: true,
      message: "Deleted Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE LOGO IMAGE
const updatePopUp = async (req, res) => {
  try {
    const oldSettingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      { popupImg: 1 }
    );

    // web
    if (req.body.web) {
      const isNewImage = req.body.web.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.web = uploadImage(req.body.web, "public/settings/");
        if (oldSettingsData?.popupImg?.web) {
          deleteFile(oldSettingsData?.popupImg?.web);
        }
      }
    } else if (!req.body.web && oldSettingsData?.popupImg?.web) {
      req.body.web = "";
      deleteFile(oldSettingsData?.popupImg?.web);
    }

    // mobile
    if (req.body.mobile) {
      const isNewImage = req.body.mobile.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.mobile = uploadImage(req.body.mobile, "public/settings/");
        if (oldSettingsData?.popupImg?.mobile) {
          deleteFile(oldSettingsData?.popupImg?.mobile);
        }
      }
    } else if (req.body.mobile === "" && oldSettingsData?.popupImg?.mobile) {
      req.body.mobile = "";
      deleteFile(oldSettingsData?.popupImg?.mobile);
    }

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: { popupImg: req.body },
      },
      {
        new: true,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData.popupImg,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateBannerText = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: req.body,
      },
      { new: true }
    );
    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData.bannerText,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE OFFER BANNER IMAGE
const updateOfferBanner = async (req, res) => {
  try {
    const oldSettingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      { offerBanner: 1 }
    );

    if (req.body.left) {
      const isNewImage = req.body.left.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.left = uploadImage(req.body.left, "public/settings/");
        if (oldSettingsData?.offerBanner?.left) {
          deleteFile(oldSettingsData?.offerBanner?.left);
        }
      }
    } else if (!req.body.left && oldSettingsData?.offerBanner?.left) {
      req.body.left = "";
      deleteFile(oldSettingsData?.offerBanner?.left);
    }

    if (req.body.right) {
      const isNewImage = req.body.right.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.right = uploadImage(req.body.right, "public/settings/");
        if (oldSettingsData?.offerBanner?.right) {
          deleteFile(oldSettingsData?.offerBanner?.right);
        }
      }
    } else if (req.body.right === "" && oldSettingsData?.offerBanner?.right) {
      req.body.right = "";
      deleteFile(oldSettingsData?.offerBanner?.right);
    }

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: { offerBanner: req.body },
      },
      {
        new: true,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData.offerBanner,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE OFFER BANNER IMAGE
const updateFeatureBanner = async (req, res) => {
  try {
    const oldSettingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      { featureBanner: 1 }
    );

    if (req.body.one) {
      const isNewImage = req.body.one.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.one = uploadImage(req.body.one, "public/settings/");
        if (oldSettingsData?.featureBanner?.one) {
          deleteFile(oldSettingsData?.featureBanner?.one);
        }
      }
    } else if (!req.body.one && oldSettingsData?.featureBanner?.one) {
      req.body.one = "";
      deleteFile(oldSettingsData?.featureBanner?.one);
    }

    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: { featureBanner: req.body },
      },
      {
        new: true,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData.featureBanner,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchFbScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      {
        allScript: 1,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript?.fbScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateFbScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: {
          "allScript.fbScript": {
            ...req.body,
            time: new Date().toISOString(),
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript.fbScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchGoogleScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      {
        allScript: 1,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript?.googleScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateGoogleScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      { resellerId: req.user._id },
      {
        $set: {
          "allScript.googleScript": {
            ...req.body,
            time: new Date().toISOString(),
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript.googleScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const fetchOtherScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne(
      { resellerId: req.user._id },
      {
        allScript: 1,
      }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript?.otherScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const updateOtherScript = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      {
        resellerId: req.user._id,
      },
      {
        $set: {
          "allScript.otherScript": {
            ...req.body,
            time: new Date().toISOString(),
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: "Could not be updated!",
      });
    }

    return res.status(200).json({
      data: settingsData?.allScript.otherScript,
      success: true,
      message: "Update Successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SETTINGS VIEW BY CUSTOMER
const viewSettingsByCustomer = async (req, res) => {
  try {
    const [categoryData, settingsData, adminSettingsData, flashData, resellerData, paymentData] =
      await Promise.all([
        CategoryModel.find({}).lean(),
        SettingsModel.findOne(
          {
            resellerId: req.reseller._id,
          },
          { pages: 0, resellerId: 0 }
        ).lean(),
        AdminSettingsModel.findOne(
          {},
          {
            deliveryCharge: 1,
            isPromoHide: 1,
            isOnlinePayHide: 1,
          }
        ).lean(),
        FlashProductModel.findOne({}, { startTime: 1, endTime: 1 }).lean(),
        ResellerModel.findOne({ _id: req.reseller._id }, { website: 1 }),
        StaticPaymentModel.find(
          {
            resellerId: req.reseller._id,
            isDisabled: false,
          },
          {
            name: 1,
            phone: 1,
            description: 1,
            image: 1,
          }
        ).lean(),
      ]);

    if (!categoryData) {
      return res.status(400).json({
        message: "Couldn't fetch categories!",
        success: false,
      });
    }
    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch settings data!",
        success: true,
      });
    }

    const categoryDetails = nestedCategories(categoryData);

    return res.status(201).json({
      data: {
        ...settingsData,
        deliveryCharge: adminSettingsData?.deliveryCharge,
        isPromoHide: adminSettingsData?.isPromoHide,
        isOnlinePayHide: adminSettingsData?.isOnlinePayHide,
        categoryData: categoryDetails,
        flashData,
        website: resellerData?.website,
        paymentData,
      },
      message: "fetch settings data successfully!",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  fetchSetting,
  updateBasicSetting,
  fetchSettingPages,
  updatePagesSetting,
  updateDeliveryCharge,

  // slider
  uploadSliderImage,
  deleteSliderImage,

  // brand
  uploadBrandImage,
  deleteBrandImage,

  updatePopUp,
  updateBannerText,

  updateOfferBanner,
  updateFeatureBanner,

  fetchFbScript,
  updateFbScript,
  fetchGoogleScript,
  updateGoogleScript,
  fetchOtherScript,
  updateOtherScript,

  // customer
  viewSettingsByCustomer,
};
