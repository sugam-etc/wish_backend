const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dateEarned: {
    type: Date,
    default: Date.now,
  },
});

const purchaseHistorySchema = new mongoose.Schema({
  itemType: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
});

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  contactNo: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  membership: {
    // This correctly references the Membership model by its ObjectId
    type: mongoose.Schema.Types.ObjectId,
    ref: "Membership",
    default: null,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  nationality: {
    type: String,
    required: [true, "Nationality is required"],
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  // Removed membershipInfo as it was causing ReferenceError and is redundant with 'membership' field
  rewards: {
    type: [rewardSchema],
    default: [],
  },
  purchaseHistory: {
    type: [purchaseHistorySchema],
    default: [],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
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

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
