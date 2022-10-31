const multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files/')
  },
  filename: function (req, file, cb) {
    cb(null,file.originalname);
  }
})
const maxSize =50 * 1000 * 1000; 

module.exports = multer({ storage : storage, limits: { fileSize: maxSize } });
