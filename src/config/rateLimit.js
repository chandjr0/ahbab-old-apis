const { RedisStore } = require("rate-limit-redis");

const RateLimit = require("express-rate-limit");
// const { redisClient } = require("../redis");

// const signinLimiter = RateLimit({
//     windowMs: 60 * 60 * 1000 * 24, // 10 minutes
//     max: 10, // limit each IP to 100 requests per windowMs,
//     message : "Too many signin attempt, please try again after 10 minutes"
// });

const signInLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many sign in attempt",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

const homeProductsLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many home products attempts",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

const productLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many  product list attempts",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

const eventLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many  product list attempts",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

const customerSettingsLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 8000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many  product list attempts",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

const customerOrderLimiter = RateLimit({
  windowMs: 30 * 60 * 1000, // 30min
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many  product list attempts",

  // windowMs: 30 * 60 * 1000, // 30min
  // max: 2000,
  // standardHeaders: true,
  // legacyHeaders: false,
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
});

// const testLimiter = RateLimit({
//   // Rate limiter configuration
//   // windowMs: 15 * 60 * 1000, // 15 minutes
//   windowMs: 30 * 1000, // 15 minutes
//   max: 5,
//   standardHeaders: true,
//   legacyHeaders: false,

//   store: new RedisStore({
//     // sendCommand: (...args) => redisClient.sendCommand(args),
//   }),
// });

module.exports = {
  signInLimiter,
  // adminDeleteLimiter,
  homeProductsLimiter,
  productLimiter,
  eventLimiter,
  customerSettingsLimiter,
  customerOrderLimiter,
  // testLimiter÷,
};
