const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    readTime: { type: String, required: true },
    content: { type: String, required: true },
    images: { type: [String], required: true }, // Array of Cloudinary URLs
  },
  { timestamps: true } // Enable createdAt / updatedAt
);

module.exports = mongoose.model("Blog", blogSchema);
