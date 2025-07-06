// models/Membership.js
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Inclusive", "Exclusive"],
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationNotes: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "bank_transfer", "e-wallet", "others"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    transactionProof: {
      type: String, // URL to uploaded proof
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
membershipSchema.index({ userId: 1 });
membershipSchema.index({ expiryDate: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ verified: 1 });

// Virtuals
membershipSchema.virtual("isActive").get(function () {
  return this.status === "active" && this.expiryDate > new Date();
});

// Pre-save hooks
membershipSchema.pre("save", function (next) {
  if (this.isModified("verified") && this.verified) {
    this.status = "active";
  }

  if (this.isModified("expiryDate") || this.isNew) {
    if (this.expiryDate < new Date() && this.status === "active") {
      this.status = "expired";
    }
  }
  next();
});

module.exports = mongoose.model("Membership", membershipSchema);
