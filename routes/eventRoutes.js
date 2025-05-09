const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Event = require("../models/Event");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

// Create Event
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, location, date, time, url } = req.body;

    if (!title || !description || !location || !date || !time || !url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "events");

    const event = new Event({
      title,
      description,
      location,
      date: new Date(date),
      time,
      url,
      image: result.secure_url,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.status(200).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update event
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, location, date, time, url } = req.body;

    if (!title || !description || !location || !date || !time || !url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    let imageUrl = event.image;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "events");
      imageUrl = result.secure_url;
    }

    event.title = title;
    event.description = description;
    event.location = location;
    event.date = new Date(date);
    event.time = time;
    event.url = url;
    event.image = imageUrl;

    await event.save();
    res.status(200).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
