const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Event = require("../models/Event");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "event-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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

    const event = new Event({
      title,
      description,
      location,
      date: new Date(date),
      time,
      url,
      image: `/uploads/${req.file.filename}`,
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
      // Delete old image if it exists
      if (event.image) {
        const oldImagePath = path.join(__dirname, "..", event.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
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

    // Delete associated image
    if (event.image) {
      const imagePath = path.join(__dirname, "..", event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
