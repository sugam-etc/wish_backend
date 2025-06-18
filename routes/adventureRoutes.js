const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Adventure = require("../models/Adventure");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup (disk storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "adventure-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Create new adventure
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
      about,
      rating,
    } = req.body;

    // Validate required fields
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

    // Parse contact (in case it's sent as JSON string)
    const parsedContact =
      typeof contact === "string" ? JSON.parse(contact) : contact;

    const adventure = new Adventure({
      name,
      type,
      shortDescription,
      location,
      duration,
      about,
      priceRange,
      hours,
      contact: {
        phone: parsedContact.phone,
        email: parsedContact.email,
        website: parsedContact.website,
      },
      rating,
      image: `/uploads/${req.file.filename}`,
    });

    const savedAdventure = await adventure.save();
    res.status(201).json(savedAdventure);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all adventures
router.get("/", async (req, res) => {
  try {
    const adventures = await Adventure.find();
    res.status(200).json(adventures);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get single adventure by ID
router.get("/:id", async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);
    if (!adventure) {
      return res.status(404).json({ error: "Adventure not found" });
    }
    res.status(200).json(adventure);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Update adventure by ID
router.put("/:id", upload.single("image"), async (req, res) => {
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
      about,
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
      !rating
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const adventure = await Adventure.findById(req.params.id);
    if (!adventure) {
      return res.status(404).json({ error: "Adventure not found" });
    }

    // Parse contact (in case it's sent as JSON string)
    const parsedContact =
      typeof contact === "string" ? JSON.parse(contact) : contact;

    // Handle image update if provided
    let imageUrl = adventure.image;
    if (req.file) {
      // Delete old image if it exists
      if (adventure.image) {
        const oldImagePath = path.join(__dirname, "..", adventure.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update fields
    adventure.name = name;
    adventure.type = type;
    adventure.shortDescription = shortDescription;
    adventure.location = location;
    adventure.duration = duration;
    adventure.priceRange = priceRange;
    adventure.hours = hours;
    adventure.contact = parsedContact;
    adventure.rating = rating;
    adventure.image = imageUrl;
    adventure.about = about;

    const updatedAdventure = await adventure.save();
    res.status(200).json(updatedAdventure);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete adventure by ID
router.delete("/:id", async (req, res) => {
  try {
    const adventure = await Adventure.findByIdAndDelete(req.params.id);
    if (!adventure) {
      return res.status(404).json({ error: "Adventure not found" });
    }

    // Delete associated image
    if (adventure.image) {
      const imagePath = path.join(__dirname, "..", adventure.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: "Adventure deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
