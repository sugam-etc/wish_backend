const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,
    website: String,
  },
  { _id: false }
); // Don't create separate _id for subdoc

const adventureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    shortDescription: { type: String, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    priceRange: { type: String, required: true },
    hours: { type: String, required: true },
    contact: { type: contactSchema, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    image: { type: String, required: true }, // Can be Cloudinary URL
    about: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Adventure", adventureSchema);
