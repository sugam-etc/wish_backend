const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/Blog");

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

// Create Blog
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { title, excerpt, category, date, readTime, content } = req.body;

    if (!title || !excerpt || !category || !date || !readTime || !content) {
      return res.status(400).json({ error: "All text fields are required." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    const imageUrls = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "blogs");
      imageUrls.push(result.secure_url);
    }

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
      imageUrls = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "blogs");
        imageUrls.push(result.secure_url);
      }
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
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
