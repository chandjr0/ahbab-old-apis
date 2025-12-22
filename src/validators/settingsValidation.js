const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const updateBasicSettingAdmin = {
  body: Joi.object().keys({
    shopName: Joi.string().trim().allow("").required(),
    subTitle: Joi.string().trim().allow("").required(),
    email: Joi.string().trim().allow("").required(),
    phone: Joi.string().trim().allow("").required(),
    address: Joi.object().keys({
      house: Joi.string().trim().allow("").required(),
      road: Joi.string().trim().allow("").required(),
      union: Joi.string().trim().allow("").required(),
      district: Joi.string().trim().allow("").required(),
      zipCode: Joi.string().trim().allow("").required(),
    }),
    socialLinks: Joi.object().keys({
      facebook: Joi.string().trim().allow("").required(),
      whatsapp: Joi.string().trim().allow("").required(),
      instagram: Joi.string().trim().allow("").required(),
      youtube: Joi.string().trim().allow("").required(),
      tiktok: Joi.string().trim().allow("", null),
    }),
    socialMediaSharing: Joi.object().keys({
      facebookPageName: Joi.string().trim().allow("").required(),
      whatsappNumber: Joi.string().trim().allow("").required(),
    }),
    logoImg: Joi.string().trim().allow("").required(),
    footerLogoImg: Joi.string().trim().allow("", null),
    footerLogoDescription: Joi.string().trim().allow("", null),
    favIcon: Joi.string().trim().allow("").required(),
    colors: Joi.object().keys({
      primary: Joi.string(),
      secondary: Joi.string(),
    }),
    isPromoHide: Joi.boolean().required(),
    isOnlinePayHide: Joi.boolean().required(),
    productDetails: Joi.object().keys({
      showPhone: Joi.boolean(),
      showWhatsapp: Joi.boolean(),
    }),
    paymentBannerImg: Joi.string().allow(""),
    appManualDiscountInfo: Joi.object().keys({
      appManualDiscountAllow: Joi.boolean(),
      typeOfDiscount:  Joi.object().keys({
        freeShippingAllow: Joi.boolean(),
        amountDiscountAllow: Joi.boolean(),
        amountDiscount: Joi.object().keys({
          minimumPurchaseAmount: Joi.number(),
          discountType: Joi.string(),
          discountValue: Joi.number()
        })
      })
    }),
  }),
};

const updateBasicSettingReseller = {
  body: Joi.object().keys({
    shopName: Joi.string().trim().allow("").required(),
    subTitle: Joi.string().trim().allow("").required(),
    email: Joi.string().trim().allow("").required(),
    phone: Joi.string().trim().allow("").required(),
    address: Joi.object().keys({
      house: Joi.string().trim().allow("").required(),
      road: Joi.string().trim().allow("").required(),
      union: Joi.string().trim().allow("").required(),
      district: Joi.string().trim().allow("").required(),
      zipCode: Joi.string().trim().allow("").required(),
    }),
    socialLinks: Joi.object().keys({
      facebook: Joi.string().trim().allow("").required(),
      whatsapp: Joi.string().trim().allow("").required(),
      instagram: Joi.string().trim().allow("").required(),
      youtube: Joi.string().trim().allow("").required(),
    }),
    logoImg: Joi.string().trim().allow("").required(),
    favIcon: Joi.string().trim().allow("").required(),
    colors: Joi.object().keys({
      primary: Joi.string().required(),
      secondary: Joi.string().required(),
    }),
  }),
};

const updatePagesSetting = {
  body: Joi.object().keys({
    pages: Joi.object().keys({
      aboutUs: Joi.string().allow("").required(),
      termsAndConditions: Joi.string().allow("").required(),
      privacyPolicy: Joi.string().allow("").required(),
      returned: Joi.string().allow("").required(),
      refund: Joi.string().allow("").required(),
    }),
  }),
};

const updateDeliveryCharge = {
  body: Joi.object().keys({
    inside: Joi.number().allow(0).required(),
    outside: Joi.number().allow(0).required(),
    miniDetails: Joi.string().allow("").required(),
    midDescription: Joi.string().allow("").required(),
    longDescription: Joi.string().allow("").required(),
  }),
};

const uploadSliderImage = {
  body: Joi.object().keys({
    url: Joi.string().allow("").required(),
    image: Joi.string().allow("").required(),
  }),
};

const uploadSliderImageForMobile = {
  body: Joi.object().keys({
    url: Joi.string().allow("").required(),
    image: Joi.string().allow("").required(),
  }),
};

const updatePopUp = {
  body: Joi.object().keys({
    isShow: Joi.boolean().required(),
    url: Joi.string().allow("").required(),
    web: Joi.string().allow("").required(),
    mobile: Joi.string().allow("").required(),
  }),
};

const updateBannerText = {
  body: Joi.object().keys({
    bannerText: Joi.object().keys({
      bannerOne: Joi.string().allow("").required(),
      bannerTwo: Joi.string().allow("").required(),
    }),
  }),
};

const updateOfferBanner = {
  body: Joi.object().keys({
    left: Joi.string().allow("").required(),
    right: Joi.string().allow("").required(),
  }),
};

const updateFeatureBanner = {
  body: Joi.object().keys({
    one: Joi.string().allow("").required(),
  }),
};

const updateFbScript = {
  body: Joi.object().keys({
    header: Joi.string().allow("").required(),
    body: Joi.string().allow("").required(),
    accessToken: Joi.string().allow("").required(),
  }),
};

const updateGoogleScript = {
  body: Joi.object().keys({
    header: Joi.string().allow("").required(),
    body: Joi.string().allow("").required(),
    tagManager: Joi.string().allow(""),
  }),
};

const updateOtherScript = {
  body: Joi.object().keys({
    header: Joi.string().allow("").required(),
    body: Joi.string().allow("").required(),
  }),
};

const updateHome = {
  body: Joi.object().keys({
    forWeb: Joi.object().keys({
      flashProduct: Joi.boolean().required(),
      featureProducts: Joi.boolean().required(),
      bestProducts: Joi.boolean().required(),
      comboProducts: Joi.boolean().required(),
      categories: Joi.array().items(Joi.objectId()).required(),
    }),
    forMobile: Joi.object().keys({
      flashProduct: Joi.boolean().required(),
      featureProducts: Joi.boolean().required(),
      bestProducts: Joi.boolean().required(),
      comboProducts: Joi.boolean().required(),
      categories: Joi.array().items(Joi.objectId()).required(),
    }),
  }),
};

const showroomCreate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    address: Joi.string().required().allow(""),
    phones: Joi.string().required().allow(""),
  }),
};

module.exports = {
  updateBasicSettingAdmin,
  updateBasicSettingReseller,
  updatePagesSetting,
  updateDeliveryCharge,
  uploadSliderImage,
  uploadSliderImageForMobile,
  updatePopUp,
  updateBannerText,
  updateOfferBanner,
  updateFeatureBanner,
  updateFbScript,
  updateGoogleScript,
  updateOtherScript,
  updateHome,
  showroomCreate,
};
