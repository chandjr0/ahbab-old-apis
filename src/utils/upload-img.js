const fs = require("fs");

const { nanoid } = require("nanoid");
// const sharp = require("sharp");

const uploadImage = (baseUrl, path, mimeName) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  let mimeType = "jpg";

  if (mimeName) {
    mimeType = mimeName;
  }

  const image = baseUrl.split(";base64,").pop();
  const ImagePath = `${path + nanoid(19)}.${mimeType}`;
  const inputBuffer = Buffer.from(image, "base64");
  // sharp(inputBuffer).toFile(ImagePath);
  fs.writeFileSync(ImagePath, inputBuffer);

  return ImagePath;
};

module.exports = uploadImage;
