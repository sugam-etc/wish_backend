const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
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
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
