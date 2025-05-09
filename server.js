const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

//CORS
const corsOptions = {
  origin: "*", // or specify a list of allowed origins
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
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("API is running");
});
//Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0); // Exit gracefully
});
// Start server (IMPORTANT: use Railway dynamic port)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
