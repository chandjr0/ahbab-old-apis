const verifyToken = (req, res, next) => {
  // console.log("req.headers: ", req.headers);
  if (!req.headers["x-pathao-signature"])
    return res.status(401).json({
      success: false,
      message: "Pathao signature key is missing!",
    });

  const signatureKey = req.headers["x-pathao-signature"];
  if (signatureKey === req.pathao.PATHAO_WEBHOOK_KEY) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Pathao signature key not match!",
  });
};

module.exports = verifyToken;
