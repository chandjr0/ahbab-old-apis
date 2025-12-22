const discountCalc = ({ totalPrice, discount }) => {
  let totalDiscountPrice = 0;
  if (discount.discountType === "PERCENT") {
    totalDiscountPrice = Math.ceil((Number(totalPrice) * Number(discount.discountPrice)) / 100);
  } else {
    totalDiscountPrice = Number(discount.discountPrice);
  }
  return totalDiscountPrice;
};

const promoVerify = (promoData, phone, products, combos, checkAllProducts) => {
  let errorMsg = "";

  if (!(promoData.startTime <= new Date() && promoData.endTime >= new Date())) {
    errorMsg = "Promo is not active right now!";
  }

  if (
    promoData?.limitInfo?.haveLimit &&
    promoData?.limitInfo?.maxUsed <= promoData?.limitInfo?.totalUsed
  ) {
    errorMsg = "The Promo code limit was exceeded!";
  }

  const totalProductPrice =
    products.reduce((prev, cur) => prev + Number(cur.quantity) * Number(cur.price), 0) || 0;
  const totalComboPrice =
    combos.reduce((prev, cur) => prev + Number(cur.quantity) * Number(cur.price), 0) || 0;

  if (promoData.minBuyingAmount > totalProductPrice + totalComboPrice) {
    errorMsg = `Minimum product prices ${promoData.minBuyingAmount}TK!`;
  }

  if (errorMsg !== "") {
    return {
      promoType: "invalid",
      discount: 0,
      errorMsg,
    };
  }

  errorMsg = "Invalid promo code.";

  if (promoData?.promoType === "regular") {
    const discount = discountCalc({
      totalPrice: totalProductPrice + totalComboPrice,
      discount: promoData?.discount,
    });

    return {
      promoType: promoData?.promoType,
      discount,
      errorMsg: "",
    };
  }
  if (promoData?.promoType === "free_delivery") {
    return {
      promoType: promoData?.promoType,
      discount: 0,
      errorMsg: "",
    };
  }
  if (promoData?.promoType === "product") {
    let totalPrice = 0;

    products.forEach((product) => {
      if (promoData?.productIds.map((item) => String(item)).includes(String(product.productId))) {
        totalPrice += Number(product.quantity) * Number(product.price) || 0;
      }
    });

    const discount = discountCalc({
      totalPrice,
      discount: promoData?.discount,
    });
    return {
      promoType: promoData?.promoType,
      discount,
      errorMsg: "",
    };
  }
  if (promoData?.promoType === "combo") {
    let totalPrice = 0;

    combos.forEach((combo) => {
      if (promoData?.comboIds.map((item) => String(item)).includes(String(combo.comboId))) {
        totalPrice += Number(combo.quantity) * Number(combo.price) || 0;
      }
    });

    const discount = discountCalc({
      totalPrice,
      discount: promoData?.discount,
    });
    return {
      promoType: promoData?.promoType,
      discount,
      errorMsg: "",
    };
  }
  if (promoData?.promoType === "category") {
    const strCategories = promoData.categoryIds.map((item) => String(item));
    const selectedIds = [];
    checkAllProducts.forEach((checkProduct) => {
      if (
        checkProduct.categories.filter((catId) => strCategories.includes(String(catId))).length > 0
      ) {
        selectedIds.push(checkProduct?._id);
      }
    });

    let totalPrice = 0;
    products.forEach((product) => {
      if (selectedIds.map((item) => String(item)).includes(String(product.productId))) {
        totalPrice += Number(product.quantity) * Number(product.price) || 0;
      }
    });

    const discount = discountCalc({
      totalPrice,
      discount: promoData?.discount,
    });

    return {
      promoType: promoData?.promoType,
      discount,
      errorMsg: "",
    };
  }
  if (promoData?.promoType === "phone") {
    if (promoData.phones.includes(phone)) {
      const discount = discountCalc({
        totalPrice: totalProductPrice + totalComboPrice,
        discount: promoData?.discount,
      });

      return {
        promoType: promoData?.promoType,
        discount,
        errorMsg: "",
      };
    }
    errorMsg = "Invalid phone number for your promo.";
  }

  return {
    promoType: "invalid",
    discount: 0,
    errorMsg,
  };
};

const promoAggregate = [
  {
    $lookup: {
      from: "categories",
      localField: "categoryIds",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "categoryData",
    },
  },
  {
    $lookup: {
      from: "products",
      localField: "productIds",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            sku: 1,
          },
        },
      ],
      as: "productData",
    },
  },
  {
    $lookup: {
      from: "combos",
      localField: "comboIds",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            sku: 1,
          },
        },
      ],
      as: "comboData",
    },
  },
];
module.exports = {
  promoVerify,
  promoAggregate,
};
