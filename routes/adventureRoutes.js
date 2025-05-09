const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Adventure = require("../models/Adventure");

// Multer setup with file type validation (only images allowed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};
const upload = multer({ storage, fileFilter });

// Get all adventures
router.get("/", async (req, res) => {
  try {
    const adventures = await Adventure.find().sort({ createdAt: -1 });
    res.json(adventures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new adventure
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      type,
      shortDescription,
      location,
      duration,
      priceRange,
      hours,
      contact,
      rating,
    } = req.body;

    if (
      !name ||
      !type ||
      !shortDescription ||
      !location ||
      !duration ||
      !priceRange ||
      !hours ||
      !contact ||
      !rating ||
      !req.file
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let imagePath = `/uploads/${req.file.filename}`;

    const adventure = new Adventure({
      name,
      type,
      shortDescription,
      location,
      duration,
      priceRange,
      hours,
      contact: {
        phone: contact.phone,
        email: contact.email,
        website: contact.website,
      },
      rating,
      image: imagePath,
    });

    const savedAdventure = await adventure.save();
    res.status(201).json(savedAdventure);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete adventure by ID
router.delete("/:id", async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);
    if (!adventure)
      return res.status(404).json({ error: "Adventure not found" });

    if (adventure.image && adventure.image.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", adventure.image);
      fs.unlink(filePath, (err) => {
        if (err) console.error(err);
      });
    }

    await Adventure.findByIdAndDelete(req.params.id);
    res.json({ message: "Adventure deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single adventure by ID
router.get("/:id", async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);
    if (!adventure) {
      return res.status(404).json({ message: "Adventure not found" });
    }
    res.json(adventure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
