const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

// CORS

// Middleware
app.use(cors());
app.use(express.json());
// Add this line after the middleware section in your server.js
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
const blogRoutes = require("./routes/blogRoutes");
const adventureRoutes = require("./routes/adventureRoutes");
const eventRoutes = require("./routes/eventRoutes");
const albumRoutes = require("./routes/albumRoutes");
// const authRoutes = require("./routes/authRoutes"); // Import authentication routes
const infoRoutes = require("./routes/infoRoutes.js");
const emailRoutes = require("./routes/emailRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const itemRoutes = require("./routes/itemRoutes.js");
const membershipRoutes = require("./routes/membershipRoutes.js");
const purchaseRoutes = require("./routes/purchaseRoutes");

app.use("/api/blogs", blogRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/albums", albumRoutes);
// app.use("/api/auth", authRoutes);
app.use("/api/infos", infoRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/purchases", purchaseRoutes);

// Database connection
mongoose
  .connect(process.env.MONGO_URI) // MongoDB connection
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Basic route for health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0); // Exit gracefully
});

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

// Start server (use dynamic port from Railway)
const PORT = process.env.PORT || 5000; // This will use the Railway dynamic port or fallback to 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
