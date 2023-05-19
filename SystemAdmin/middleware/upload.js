const multer = require('multer');
const path = require("path");
// configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,'../public/uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-QuestionBankFile-' + file.originalname); // specify the filename
  }
});

const upload = multer({ storage: storage });
module.exports = upload;