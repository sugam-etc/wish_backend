const express = require("express");
const router = express.Router();
const multer = require("multer");
const Event = require("../models/Event");
const path = require("path");
const fs = require("fs");

// Multer setup for file upload
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

// GET: Fetch all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST: Create new event
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

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(400).json({ error: "Failed to create event" });
  }
});

// GET: Fetch single event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// DELETE: Delete event by ID
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Delete image file if exists
    if (event.image && event.image.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", event.image);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

module.exports = router;
