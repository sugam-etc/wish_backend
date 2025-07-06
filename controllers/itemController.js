const Item = require("../models/Item");
const fs = require("fs");
const path = require("path");

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, featured } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const item = new Item({
      name,
      price,
      description,
      category,
      stock,
      featured: featured === "true",
      image: req.file.path,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating item",
      error: error.message,
    });
  }
};

// Get all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single item
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, featured } = req.body;

    const updateData = {
      name,
      price,
      description,
      category,
      stock,
      featured: featured === "true",
      updatedAt: Date.now(),
    };

    if (req.file) {
      // Delete old image if new one is uploaded
      const oldItem = await Item.findById(req.params.id);
      if (oldItem && oldItem.image) {
        const oldImagePath = path.join(__dirname, "..", oldItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = req.file.path;
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Delete the associated image
    if (item.image) {
      const imagePath = path.join(__dirname, "..", item.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
