const path = require("path");
const fs = require("fs");

const clearImage = (ImgUrl) => {
  const ImgPath = path.join(process.cwd(), ImgUrl);
  fs.unlink(ImgPath, (err) => {
    if (err) {
      console.log("File Couldn't Deleted! ", err);
    }
  });
};

module.exports = clearImage;
