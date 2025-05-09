const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

// CORS
const corsOptions = {
  origin: "*", // Allow all origins (can be restricted to specific domains)
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const blogRoutes = require("./routes/blogRoutes");
const adventureRoutes = require("./routes/adventureRoutes");
const eventRoutes = require("./routes/eventRoutes");

app.use("/api/blogs", blogRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/events", eventRoutes);

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
