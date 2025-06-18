const Album = require("../models/Album");
const fs = require("fs");
const path = require("path");

// Create a new album with up to 100 images
// controllers/albumController.js
exports.createAlbum = async (req, res) => {
  try {
    console.log("Request files:", req.files); // Debug log

    if (!req.files?.coverImage) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    const { title, description, date } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Process cover image
    const coverImage = {
      path: `/uploads/${req.files.coverImage[0].filename}`,
      filename: req.files.coverImage[0].filename,
    };

    // Process album images (if any)
    const albumImages = [];
    if (req.files.albumImages) {
      albumImages.push(
        ...req.files.albumImages.map((file) => ({
          path: `/uploads/${file.filename}`,
          filename: file.filename,
        }))
      );
    }

    const newAlbum = new Album({
      title,
      description: description || "",
      date: date || new Date(),
      coverImage,
      images: albumImages,
    });

    await newAlbum.save();

    res.status(201).json({
      success: true,
      data: newAlbum,
    });
  } catch (err) {
    console.error("Error creating album:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while creating album",
    });
  }
};

// Get all albums
exports.getAllAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: albums,
    });
  } catch (err) {
    next(err);
  }
};

// Get single album
exports.getAlbumById = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    res.status(200).json({
      success: true,
      data: album,
    });
  } catch (err) {
    next(err);
  }
};

// Delete album
exports.deleteAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    // Delete files from filesystem
    const deleteFile = (filename) => {
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    deleteFile(album.coverImage.filename);
    album.images.forEach((image) => deleteFile(image.filename));

    await Album.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Album deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
