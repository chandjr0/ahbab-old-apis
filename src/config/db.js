const chalk = require("chalk");
const Mongoose = require("mongoose");
const logger = require("../lib/logger");

Mongoose.set("useCreateIndex", true);

const db = async (app) => {
  try {
    const mongoOptions = {
      poolSize: 2,
      connectTimeoutMS: 50000,
      // socketTimeoutMS: 60000,
      tlsInsecure: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      retryWrites: false, // Disable retryable writes for standalone MongoDB
    };

    await Mongoose.connect(process.env.DB_URI, mongoOptions);
    logger.info(chalk.blue("Database Connection Succeeded!"));
    return app;
  } catch (err) {
    console.error("Connection Error", err);
    return process.exit(1);
  }
};

module.exports = db;
