const express = require("express");
const router = express.Router();
const infoController = require("../controllers/infoController");

// Create a new info
router.post("/", infoController.createInfo);

// Get all info
router.get("/", infoController.getAllInfo);

// Get a single info
router.get("/:id", infoController.getInfo);

// Update an info
router.put("/:id", infoController.updateInfo);

// Delete an info
router.delete("/:id", infoController.deleteInfo);
// Get latest info
router.get("/get/latest", infoController.getLatestInfo);
module.exports = router;
