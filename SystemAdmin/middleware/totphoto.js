const multer = require("multer");
const path = require('path');
const imageFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image")) {
        cb(null, true);
      } else {
        cb("Please upload only images.", false);
      }
};
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,'../public/uploads/'));
  
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-TOTProfile-${file.originalname}`);

  },
});
var totphoto = multer({ storage: storage, fileFilter: imageFilter });

module.exports = totphoto;