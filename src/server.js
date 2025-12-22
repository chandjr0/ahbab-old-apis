require("dotenv").config();
const http = require("http");
const chalk = require("chalk");
const express = require("express");

const compression = require("compression");
const logger = require("./lib/logger");
const routes = require("./routes");
const middlewares = require("./middlewares");
const httpErrors = require("./lib/errorHandler");
const db = require("./config/db");
// require("./redis");

const app = express();
// app.enable("trust proxy"); // only if behind a reverse proxy (Heroku, AWS ELB, Nginx, etc)
app.set("trust proxy", 1);

app.use("/public", [express.static("public")]);

app.use(
  compression({
    level: 6,
    threshold: 10 * 1000,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

middlewares(app); // initialize middlewares
db(app); // database connection
routes(app); // initialize routes

require("./Jobs/flashJob");
require("./Jobs/redxCourier");
require("./Jobs/steadfastCourier");

httpErrors(app); // initialize error handlers

const port = process.env.PORT || 8074;
const server = http.createServer(app);

server.listen(port, () =>
  logger.info(chalk.bgGreen(`Server running on port: ${chalk.bgGreen(port)} `))
);
