const express = require("express");
const router = express.Router();
const Email = require("../models/Email");

// POST /api/emails
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Email is required" });
    }

    const email = new Email({ title });
    await email.save();

    res.status(201).json({
      message: "Subscription successful",
      email,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// GET - Retrieve all emails
router.get("/", async (req, res) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json({
      count: emails.length,
      data: emails,
    });
  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

module.exports = router;
