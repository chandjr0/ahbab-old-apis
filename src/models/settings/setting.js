// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const settingSchema = new Schema(
  {
    logoImg: {
      type: String,
      default: "",
    },
    footerLogoImg: {
      type: String,
      default: "",
    },
    footerLogoDescription: {
      type: String,
      default: "",
    },
    favIcon: {
      type: String,
      default: "",
    },
    shopName: {
      type: String,
      default: "",
    },
    subTitle: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    bkashTokenInfo: {
      token: {
        type: String,
        default: ""
      },
      expireTime: {
        type: Number,
        default: 0
      }
    },
    address: {
      house: {
        type: String,
        default: "",
      },
      road: {
        type: String,
        default: "",
      },
      union: {
        type: String,
        default: "",
      },
      district: {
        type: String,
        default: "",
      },
      zipCode: {
        type: String,
        default: "",
      },
    },
    socialLinks: {
      facebook: {
        type: String,
        default: "",
      },
      whatsapp: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
      youtube: {
        type: String,
        default: "",
      },
      tiktok: {
        type: String,
        default: "",
      },
    },
    socialMediaSharing: {
      facebookPageName: {
        type: String,
        default: "",
      },
      whatsappNumber: {
        type: String,
        default: "",
      },
    },
    deliveryCharge: {
      inside: {
        d_type: {
          type: String,
          default: "INSIDE",
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
      outside: {
        d_type: {
          type: String,
          default: "OUTSIDE",
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
      miniDetails: {
        type: String,
        default: "",
      },
      midDescription: {
        type: String,
        default: "",
      },
      longDescription: {
        type: String,
        default: "",
      },
    },
    pages: {
      aboutUs: {
        type: String,
        default: "",
      },
      termsAndConditions: {
        type: String,
        default: "",
      },
      privacyPolicy: {
        type: String,
        default: "",
      },
      returned: {
        type: String,
        default: "",
      },
      refund: {
        type: String,
        default: "",
      },
    },
    sliderImgs: [
      {
        image: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          default: "",
        },
      },
    ],
    sliderImgsForMobile: [
      {
        image: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          default: "",
        },
      },
    ],
    brandImgs: [
      {
        image: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          default: "",
        },
      },
    ],
    popupImg: {
      web: {
        type: String,
        default: "",
      },
      mobile: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
      isShow: {
        type: Boolean,
        default: false,
      },
    },
    bannerText: {
      bannerOne: {
        type: String,
        default: "",
      },
      bannerTwo: {
        type: String,
        default: "",
      },
    },
    colors: {
      primary: {
        type: String,
        default: "",
      },
      secondary: {
        type: String,
        default: "",
      },
    },
    offerBanner: {
      left: {
        type: String,
        default: "",
      },
      right: {
        type: String,
        default: "",
      },
    },
    featureBanner: {
      one: {
        type: String,
        default: "",
      },
    },
    allScript: {
      fbScript: {
        header: {
          type: String,
          default: "",
        },
        body: {
          type: String,
          default: "",
        },
        accessToken: {
          type: String,
          default: "",
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
      googleScript: {
        header: {
          type: String,
          default: "",
        },
        body: {
          type: String,
          default: "",
        },
        tagManager: {
          type: String,
          default: "",
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
      otherScript: {
        header: {
          type: String,
          default: "",
        },
        body: {
          type: String,
          default: "",
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    },
    isPromoHide: {
      type: Boolean,
      default: false,
    },
    isOnlinePayHide: {
      type: Boolean,
      default: false,
    },
    productDetails: {
      showPhone: {
        type: Boolean,
        default: true,
      },
      showWhatsapp: {
        type: Boolean,
        default: true,
      },
    },
    paymentBannerImg: {
      type: String,
      default: "",
    },
    appManualDiscountInfo: {
      appManualDiscountAllow: {
        type: Boolean,
        default: false,
      },
      typeOfDiscount: {
        freeShippingAllow: {
          type: Boolean,
          default: false,
        },
        amountDiscountAllow: {
          type: Boolean,
          default: false,
        },
        amountDiscount: {
          minimumPurchaseAmount: {
            type: Number,
            default: 0
          },
          discountType: {
            type: String,
            default: 'flat',
            enum: ['flat', 'percentage']
          },
          discountValue: {
            type: Number,
            default: 0
          }
        }
      }
    }
  },
  {
    timestamps: true,
    index: true,
  }
);
module.exports = mongoose.model("setting", settingSchema);
