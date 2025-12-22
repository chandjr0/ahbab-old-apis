const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    req.user = {
      role: "visitor",
    };
    return next();
  }
  const token = req.headers.authorization.replace(/^Bearer\s/, "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Token Missing" });
  }
  try {
    jwt.verify(token, process.env.TOKEN_SECRET, false, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Forbidden",
        });
      }

      req.user = decoded?.data || decoded;
      return next();
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports = verifyToken;
