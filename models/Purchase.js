// models/Purchase.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const purchaseItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const purchaseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  contact: {
    type: String,
    required: true,
    trim: true,
  },
  items: {
    type: [purchaseItemSchema],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
  },
  paymentProof: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
purchaseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Purchase", purchaseSchema);
