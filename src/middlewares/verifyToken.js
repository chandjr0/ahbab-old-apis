const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(401).json({
      success: false,
      message: "Unauthorized User (Token Required).",
    });

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

      req.user = decoded.data;
    });
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = verifyToken;
