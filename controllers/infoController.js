const Info = require("../models/Info");

// Create new info
exports.createInfo = async (req, res) => {
  try {
    const { title } = req.body;
    const info = new Info({ title });
    await info.save();
    res.status(201).json(info);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all info
exports.getAllInfo = async (req, res) => {
  try {
    const infos = await Info.find().sort({ createdAt: -1 });
    res.json(infos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single info
exports.getInfo = async (req, res) => {
  try {
    const info = await Info.findById(req.params.id);
    if (!info) {
      return res.status(404).json({ error: "Info not found" });
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update info
exports.updateInfo = async (req, res) => {
  try {
    const { title } = req.body;
    const info = await Info.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true }
    );
    if (!info) {
      return res.status(404).json({ error: "Info not found" });
    }
    res.json(info);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete info
exports.deleteInfo = async (req, res) => {
  try {
    const info = await Info.findByIdAndDelete(req.params.id);
    if (!info) {
      return res.status(404).json({ error: "Info not found" });
    }
    res.json({ message: "Info deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get latest info
exports.getLatestInfo = async (req, res) => {
  try {
    const latestInfo = await Info.findOne()
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript object

    if (!latestInfo) {
      return res.status(404).json({
        success: false,
        message: "No info found",
      });
    }

    res.status(200).json({
      success: true,
      data: latestInfo,
    });
  } catch (error) {
    console.error("Error fetching latest info:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
