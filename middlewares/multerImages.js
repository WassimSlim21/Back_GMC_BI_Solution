const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${new Date()
        .toISOString()
        .replace(/\.|:|-|T/g, "")
        .slice(0, -1)}-${file.originalname.replace(/\s/g, "")}`
    );
  },
});
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
};

module.exports = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10000000 },
});
