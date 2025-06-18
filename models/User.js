// backend/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing

// Define the User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"], // Username is mandatory
    unique: true, // Ensures unique usernames
    trim: true, // Removes whitespace from both ends of a string
    minlength: [3, "Username must be at least 3 characters long"], // Minimum length for username
  },
  password: {
    type: String,
    required: [true, "Password is required"], // Password is mandatory
    minlength: [6, "Password must be at least 6 characters long"], // Minimum length for password
  },
  role: {
    type: String,
    enum: ["admin", "user"], // Role can only be 'admin' or 'user'
    default: "admin", // Default role is 'admin' if not specified
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set creation date
  },
});

// Middleware to hash the password before saving the user
// This runs before the 'save' event on the User document
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next(); // If password is not modified, skip hashing and move to the next middleware/save operation
  }

  try {
    // Generate a salt (random string) with 10 rounds for hashing.
    // The salt adds randomness to the hash, making it harder to crack via rainbow tables.
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Move to the next middleware or save operation
  } catch (error) {
    // If an error occurs during hashing, pass it to the next middleware
    next(error);
  }
});

// Method to compare the entered password with the hashed password in the database
// This will be called on a User document instance (e.g., user.comparePassword('plainTextPassword'))
UserSchema.methods.comparePassword = async function (enteredPassword) {
  // Use bcrypt.compare to compare the plaintext password with the hashed password.
  // This method handles the salting automatically.
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model("User", UserSchema);
module.exports = User;
