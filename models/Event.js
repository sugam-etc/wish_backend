const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    url: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
