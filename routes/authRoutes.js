// backend/routes/authRoutes.js
const User = require("../models/User");
const express = require("express");
const { adminLogin } = require("../controllers/authController"); // Import the adminLogin controller

const router = express.Router(); // Create a new router instance

// Define the POST route for admin login
// When a POST request is made to /api/auth/admin/login, the adminLogin function will be executed.
router.post("/admin/login", adminLogin);
// // TEMPORARY ADMIN CREATION ROUTE - REMOVE AFTER USE
// router.post("/admin/create", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = new User({
//       username,
//       password,
//       role: "admin", // Explicitly set as admin
//     });
//     await user.save();
//     res.status(201).json({ message: "Admin user created" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

module.exports = router; // Export the router to be used in index.js
