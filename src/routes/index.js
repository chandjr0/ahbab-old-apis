const initialRoute = require("./initialMsg");
const adminRoute = require("./user/admin");
const attributeRoute = require("./productAssets/attribute");
const categoryRoute = require("./productAssets/category");
const brandRoute = require("./productAssets/brand");
const productRoute = require("./product/index");
const promoRoute = require("./productAssets/promo");
const flashdealRoute = require("./productAssets/flashDeal");
const stickerRoute = require("./productAssets/sticker");
const customerRoute = require("./user/customer/index");
// const orderRoute = require("./order/index");
const courierRoute = require("./courier/courier");
const courierTrackRoute = require("./order/courierTrack");
const settingsRoute = require("./settings/index");
const homeRoute = require("./home/home");
const resellerHomeRoute = require("./home/resellerHome");
const employeeRoute = require("./user/employee");
const supplierRoute = require("./user/supplier");
const expenseRoute = require("./expense/expense");
const purchaseRoute = require("./purchase/purchase");
const stockAdjustRoute = require("./stockAdjust/stockAdjust");
// const campaignRoute = require("./campaign/campaign");
const reportRoute = require("./report/report");
const resellerRoute = require("./user/reseller");
// const resellerApplicantRoute = require("./user/resellerApplicant");
const locationRoute = require("./location/location");

// const courierServiceRoute = require("./courier/courierService");
const courierServiceRoute = require("./courierServices/index");

const adminOrder = require("./adminOrder/adminOrder");
const adminCustomerOrder = require("./adminOrder/customerOrder");
const resellerOrder = require("./resellerOrder/resellerOrder");
const resellerCustomerOrder = require("./resellerOrder/customerOrder");
const resellerAdminOrder = require("./resellerOrder/adminOrder");
const resellerPaymentRoute = require("./resellerPayment/resellerPayment");
const dashboardRoute = require("./dashboard/dashboard");
const comboRoute = require("./comboProduct/index");
const resellerEmployee = require("./user/resellerEmployee");
const conversionAPiRoute = require("./conversionApi/conversionApi");
const bkashRoute = require("./onlinePayment/onlinePaymentBkash");

const routes = [
  { path: "/admin", controller: adminRoute },
  { path: "/attribute", controller: attributeRoute },
  { path: "/category", controller: categoryRoute },
  { path: "/brand", controller: brandRoute },
  { path: "/product", controller: productRoute },
  { path: "/promo", controller: promoRoute },
  { path: "/flashdeal", controller: flashdealRoute },
  { path: "/customer", controller: customerRoute },
  { path: "/courier-track", controller: courierTrackRoute },
  { path: "/sticker", controller: stickerRoute },
  { path: "/setting", controller: settingsRoute },
  { path: "/courier", controller: courierRoute },

  // { path: "/courier-service", controller: courierServiceRoute }, // this will be rename
  { path: "/courier-service", controller: courierServiceRoute },

  { path: "/employee", controller: employeeRoute },
  { path: "/reseller-employee", controller: resellerEmployee },
  { path: "/supplier", controller: supplierRoute },
  { path: "/expense", controller: expenseRoute },
  { path: "/purchase", controller: purchaseRoute },
  { path: "/stock-adjust", controller: stockAdjustRoute },
  // { path: "/campaign", controller: campaignRoute },
  { path: "/report", controller: reportRoute },
  { path: "/reseller", controller: resellerRoute },
  // { path: "/reseller-applicant", controller: resellerApplicantRoute },
  { path: "/location", controller: locationRoute },

  { path: "/home", controller: homeRoute },
  { path: "/reseller-home", controller: resellerHomeRoute },

  // { path: "/order", controller: orderRoute }, // this will be removed

  { path: "/admin-order", controller: adminOrder },
  { path: "/admin-order/customer", controller: adminCustomerOrder },
  { path: "/reseller-order", controller: resellerOrder },
  { path: "/reseller-order/customer", controller: resellerCustomerOrder },
  { path: "/reseller-order/admin", controller: resellerAdminOrder },
  { path: "/reseller-payment", controller: resellerPaymentRoute },

  { path: "/dashboard", controller: dashboardRoute },
  { path: "/combo", controller: comboRoute },
  { path: "/fb", controller: conversionAPiRoute },

  { path: "/online-payment", controller: bkashRoute },
];

module.exports = (app) => {
  app.use(`/api/v1`, initialRoute);
  routes.forEach((route) => {
    app.use(`/api/v1${route.path}`, route.controller);
  });
};
