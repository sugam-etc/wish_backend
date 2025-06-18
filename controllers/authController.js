// backend/controllers/authController.js

const User = require("../models/User"); // Import the User model
const jwt = require("jsonwebtoken"); // Import jsonwebtoken for creating tokens

// Function to generate a JWT token
// It takes a user ID and returns a signed token
const generateToken = (id) => {
  // The token expires in 1 hour (3600 seconds). Adjust as needed.
  // The secret key is loaded from environment variables for security.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// @desc    Authenticate admin user & get token
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  // Destructure username and password from the request body
  const { username, password } = req.body;

  // Input validation: Check if both username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  try {
    // Find the user by username in the database
    const user = await User.findOne({ username });

    // Check if the user exists and if their role is 'admin'
    // This ensures only admin users can log in via this route
    if (!user || user.role !== "admin") {
      // If user not found or not an admin, return 401 Unauthorized
      return res
        .status(401)
        .json({ message: "Invalid credentials or not an admin" });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await user.comparePassword(password);

    // If passwords do not match
    if (!isMatch) {
      // Return 401 Unauthorized
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If authentication is successful, generate a JWT token for the user
    const token = generateToken(user._id);

    // Send a success response with the user ID, username, role, and the generated token
    res.status(200).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: token,
      message: "Admin login successful",
    });
  } catch (error) {
    // If any error occurs during the process (e.g., database error), return 500 Internal Server Error
    console.error(`Error during admin login: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};
// // TEMPORARY ROUTE - REMOVE AFTER CREATING ADMIN
// const createAdmin = async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = new User({ username, password });
//     await user.save();
//     res.status(201).json({ message: "Admin user created" });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating admin" });
//   }
// };

// Then add to module.exports:
module.exports = {
  adminLogin,
};
// You can add other admin-related controllers here if needed,
// for example, creating new admin users (after securing this route).
