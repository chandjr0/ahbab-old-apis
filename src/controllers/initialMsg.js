// initial message
const initialMsg = async (req, res) => {
  try {
    res.status(200).json({
      message: "Welcome to Server!",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  initialMsg,
};
