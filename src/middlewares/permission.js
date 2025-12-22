const permission = (...allowed) => {
  const isAllowed = (role) => allowed.map((v) => v.toLowerCase()).indexOf(role.toLowerCase()) > -1;
  return (req, res, next) => {
    if (req.user && isAllowed(req.user.role)) {
      next();
    } else {
      res.status(401).json({
        status: false,
        message: "Forbidden User",
      });
    }
  };
};

module.exports = permission;
