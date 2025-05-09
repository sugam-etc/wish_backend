const express = require("express");
const multer = require("multer");
const Blog = require("../models/Blog");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer setup with file type validation (only images allowed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

// Setup Multer to accept an array of images (max 5 images)
const upload = multer({ storage, fileFilter });

// POST: Create new blog (multiple images)
router.post("/", upload.array("images", 5), async (req, res) => {
  // Allow up to 5 images
  try {
    const { title, excerpt, category, date, readTime, content } = req.body;

    if (!title || !excerpt || !category || !date || !readTime || !content) {
      return res.status(400).json({ error: "All text fields are required." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    // Map uploaded files to their paths
    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

    const blog = new Blog({
      title,
      excerpt,
      category,
      date: new Date(date),
      readTime,
      content,
      images: imagePaths, // Store multiple images as an array
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    console.error("Blog creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET: Fetch all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch single blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update blog by ID (multiple images)
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { title, excerpt, category, date, readTime, content } = req.body;
    const updateData = {
      title,
      excerpt,
      category,
      date: new Date(date),
      readTime,
      content,
    };

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
      updateData.images = imagePaths; // Update images to be an array of paths
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Delete blog by ID
// DELETE: Delete blog by ID
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Delete image files asynchronously
    const deletePromises = blog.images.map((imagePath) => {
      // Adjust path to match the uploads folder
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        path.basename(imagePath)
      );

      return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
            return reject(err); // Reject the promise if an error occurs
          }
          resolve(); // Resolve if the file is successfully deleted
        });
      });
    });

    // Wait for all files to be deleted before proceeding
    await Promise.all(deletePromises);

    // Delete the blog post from the database
    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
