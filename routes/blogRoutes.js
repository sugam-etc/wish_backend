const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../models/Blog");

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
    cb(null, "blog-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Create Blog
router.post("/", upload.array("images", 50), async (req, res) => {
  try {
    const { title, excerpt, category, date, readTime, content } = req.body;

    if (!title || !excerpt || !category || !date || !readTime || !content) {
      return res.status(400).json({ error: "All text fields are required." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

    const blog = new Blog({
      title,
      excerpt,
      category,
      date: new Date(date),
      readTime,
      content,
      images: imageUrls,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("Blog creation error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.status(200).json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update blog
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { title, excerpt, category, date, readTime, content } = req.body;

    if (!title || !excerpt || !category || !date || !readTime || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    let imageUrls = blog.images;
    if (req.files && req.files.length > 0) {
      // Delete old images
      blog.images.forEach((image) => {
        const imagePath = path.join(__dirname, "..", image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

      imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    }

    blog.title = title;
    blog.excerpt = excerpt;
    blog.category = category;
    blog.date = new Date(date);
    blog.readTime = readTime;
    blog.content = content;
    blog.images = imageUrls;

    await blog.save();
    res.status(200).json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete blog
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Delete associated images
    blog.images.forEach((image) => {
      const imagePath = path.join(__dirname, "..", image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
