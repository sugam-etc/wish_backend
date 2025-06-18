const multer = require("multer");
const path = require("path");

// Shared storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Shared file filter
const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/i;
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && filetypes.test(mimetype)) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Error: Only image files are allowed (jpeg, jpg, png, gif, webp)"
      )
    );
  }
};

// Create separate upload configurations
module.exports = {
  // For exhibitions
  exhibitionUpload: multer({
    storage: storage,
    fileFilter: imageFileFilter,
  }).fields([
    { name: "heroImage", maxCount: 1 },
    { name: "mainContentImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 100 }, // Max 100 gallery images
  ]),

  // For albums
  albumUpload: multer({
    storage: storage,
    fileFilter: imageFileFilter,
  }).fields([
    { name: "coverImage", maxCount: 1 },
    { name: "albumImages", maxCount: 100 }, // Max 100 album images
  ]),

  // Error handler middleware
  multerErrorHandler: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message:
            err.message ||
            "Unexpected file field. Please check image types or field names.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Maximum 100 files allowed per upload",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Multer Error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Error processing file upload",
      });
    }
    next();
  },
};
