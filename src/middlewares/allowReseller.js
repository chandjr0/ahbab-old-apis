// status = all, active, inactive

const permission = (status) => (req, res, next) => {
  if (req.reseller) {
    if (status === "all") {
      return next();
    }
    if (status === req.reseller.status) {
      return next();
    }
    return res.status(401).json({
      status: false,
      message: "Inactive reseller site",
    });
  }
  return res.status(401).json({
    status: false,
    message: "Forbidden reseller site",
  });
};
module.exports = permission;
