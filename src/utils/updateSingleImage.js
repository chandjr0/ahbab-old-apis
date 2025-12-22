const uploadImage = require("./upload-img");
const deleteFile = require("./delete-file");

const updateImage = (prevUrl, bodyUrl, path, mimeName) => {
  let imageUrl = "";

  if (prevUrl === "" && bodyUrl === "") {
    return imageUrl;
  }
  if (prevUrl && bodyUrl === "") {
    deleteFile(prevUrl);
    return imageUrl;
  }

  const isNewImage = bodyUrl.substring(0, 6);
  if (isNewImage !== "public") {
    imageUrl = uploadImage(bodyUrl, path, mimeName);

    if (prevUrl) {
      deleteFile(prevUrl);
    }
  } else {
    imageUrl = bodyUrl;
  }

  return imageUrl;
};

module.exports = updateImage;
