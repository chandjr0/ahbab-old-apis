const SettingsModel = require("../../models/settings/setting");
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
    const settingsData = await SettingsModel.findOne({}, { pages: 0 });

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch settings data!",
        success: true,
      });
    }

    return res.status(201).json({
      data: settingsData,
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

// UPDATE BASIC SETTINGS
const updateBasicSetting = async (req, res) => {
  try {
    const oldSettingsData = await SettingsModel.findOne({});

    req.body.logoImg = updateSingleFile(
      oldSettingsData?.logoImg,
      req.body.logoImg,
      "public/settings/",
      "ico"
    );

    if(req.body.footerLogoImg) {
      req.body.footerLogoImg = updateSingleFile(
        oldSettingsData?.footerLogoImg,
        req.body.footerLogoImg,
        "public/settings/",
        "ico"
      );
    }

    req.body.favIcon = updateSingleFile(
      oldSettingsData?.favIcon,
      req.body.favIcon,
      "public/settings/"
    );

    if (req.body.paymentBannerImg) {
      req.body.paymentBannerImg = updateSingleFile(
        oldSettingsData?.paymentBannerImg,
        req.body.paymentBannerImg,
        "public/settings/"
      );
    } else {
      req.body.paymentBannerImg = "";
    }

    const settingsData = await SettingsModel.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update settings data!",
        success: false,
      });
    }

    return res.status(200).json({
      data: settingsData,
      message: "Update settings data successfully!",
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

// FETCH SETTINGS PAGES VIEW
const fetchSettingPages = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne({}, { pages: 1 });

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch settings pages data!",
        success: false,
      });
    }

    return res.status(201).json({
      data: settingsData,
      message: "fetch settings pages data successfully!",
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

// UPDATE PAGES SETTING
const updatePagesSetting = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true }
    );

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update settings pages!",
        success: false,
      });
    }

    return res.status(200).json({
      data: null,
      message: "Update settings pages successfully!",
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
      {},
      {
        $set: obj,
      }
    );
    const data = await SettingsModel.findOne(
      {},
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
      {},
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

// UPLOAD SLIDER IMAGE FOR MOBILE
const uploadSliderImageForMobile = async (req, res) => {
  try {
    req.body.image = uploadImage(req.body.image, "public/settings/");

    const settingsData = await SettingsModel.findOneAndUpdate(
      {},
      {
        $push: {
          sliderImgsForMobile: {
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
      {},
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

// DELETE SLIDER IMAGE FOR MOBILE
const deleteSliderImageForMobile = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOneAndUpdate(
      {},
      {
        $pull: {
          sliderImgsForMobile: { _id: req.body._id },
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
      {},
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
      {},
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
    /*
    const a = await SettingsModel.findOneAndUpdate(
      {},
      {
        $set: {
          "popupImg.isShow": 1,
        },
      },
      { new: true }
    );

    return res.json({ a });
    */

    const oldSettingsData = await SettingsModel.findOne({}, { popupImg: 1 });

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
      {},
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
      {},
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
    const oldSettingsData = await SettingsModel.findOne({}, { offerBanner: 1 });

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
      {},
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
    const oldSettingsData = await SettingsModel.findOne({}, { featureBanner: 1 });

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
      {},
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
      {},
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
      {},
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
      {},
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
      {},
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
      {},
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
      {},
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
    const [categoryData, settingsData, flashData, paymentData] = await Promise.all([
      CategoryModel.find({}).lean(),
      SettingsModel.findOne(
        {
          resellerId: null,
        },
        { pages: 0, resellerId: 0 }
      ).lean(),
      FlashProductModel.findOne({}, { startTime: 1, endTime: 1 }).lean(),
      StaticPaymentModel.find(
        {
          resellerId: null,
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
      return res.status(400).json({
        data: null,
        message: "Failed to fetch settings data!",
        success: false,
      });
    }

    const categoryDetails = nestedCategories(categoryData);

    return res.status(201).json({
      data: { ...settingsData, categoryData: categoryDetails, flashData, paymentData },
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
  uploadSliderImageForMobile,
  deleteSliderImageForMobile,

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

  viewSettingsByCustomer,
};
