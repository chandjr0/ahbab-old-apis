// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const settingSchema = new Schema(
  {
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "reseller",
      index: true,
      default: null,
    },
    logoImg: {
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
    },
  },
  {
    timestamps: true,
    index: true,
  }
);
module.exports = mongoose.model("reseller_setting", settingSchema);
