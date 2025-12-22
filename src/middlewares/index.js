// const { rateLimit } = require("express-rate-limit");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const morgan = require("morgan");
const log = require("../lib/logger");

const sessionConfig = {
  secret: process.env.TOKEN_SECRET,
  resave: false,
  saveUninitialized: true,
};

// const limiter = rateLimit({
//   windowMs: 30 * 60 * 1000, // 15 minutes
//   limit: 500, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
// });

module.exports = (app) => {
  // app.use(cors());
  app.use(
    cors({
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Length",
        "X-PATHAO-Signature",
        "API-KEY",
      ],
    })
  );

  // app.use(limiter);
  app.use(helmet());

  app.use(session(sessionConfig));
  app.use("/public", [express.static("public")]);
  app.use(express.json({ limit: "50mb", extended: true }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(morgan("dev", { stream: { write: (m) => log.http(m.trim()) } }));

  // Middleware to log IP addresses
  app.use((req, res, next) => {
    log.info(
      `Request from IP: ${
        req.headers["x-forwarded-for"]
          ? `${req.headers["x-forwarded-for"].split(":").pop()} -> ${req.headers["x-real-ip"]}`
          : req.ip
      }`
    );
    next();
  });
};
