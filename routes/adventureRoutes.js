// routes/adventureRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Adventure = require("../models/Adventure");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

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

    // Upload image to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(
      req.file.buffer,
      "adventures"
    );

    const adventure = new Adventure({
      name,
      type,
      shortDescription,
      location,
      duration,
      priceRange,
      hours,
      contact: {
        phone: parsedContact.phone,
        email: parsedContact.email,
        website: parsedContact.website,
      },
      rating,
      image: cloudinaryResponse.secure_url,
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

    // Upload new image if provided
    let imageUrl = adventure.image;
    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(
        req.file.buffer,
        "adventures"
      );
      imageUrl = cloudinaryResponse.secure_url;
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
    res.status(200).json({ message: "Adventure deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
