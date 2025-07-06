const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const { itemUpload } = require("../config/multer"); // This is already the middleware function
const { admin } = require("../middleware/authMiddleware");

// Create a new item (admin only)
router.post(
  "/",
  itemUpload, // No need to call .single() again - it's already done in multer.js

  itemController.createItem
);

// Get all items (public)
router.get("/", itemController.getItems);

// Get single item (public)
router.get("/:id", itemController.getItem);

// Update item (admin only)
router.put(
  "/:id",
  itemUpload, // Same here
  admin,
  itemController.updateItem
);

// Delete item (admin only)
router.delete("/:id", itemController.deleteItem);

module.exports = router;
