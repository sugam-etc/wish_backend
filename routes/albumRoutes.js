const express = require("express");
const router = express.Router();
const { albumUpload, multerErrorHandler } = require("../config/multer");
const albumController = require("../controllers/albumController");

router.post(
  "/",
  (req, res, next) => {
    albumUpload(req, res, (err) => {
      if (err) return multerErrorHandler(err, req, res, next);
      next();
    });
  },
  albumController.createAlbum
);

router.get("/", albumController.getAllAlbums);
router.get("/:id", albumController.getAlbumById);
router.delete("/:id", albumController.deleteAlbum);

module.exports = router;
