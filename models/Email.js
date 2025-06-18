const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Email", emailSchema);
