// routes/purchaseRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getUserPurchases,
  rejectPurchase,
  approvePurchase,
  updatePurchaseStatus,
} = require("../controllers/purchaseController");
const { protect, admin } = require("../middleware/authMiddleware");
const { purchaseUpload } = require("../config/multer");
router.post("/", protect, purchaseUpload, createPurchase);

router.get("/", protect, admin, getPurchases);
router.get("/user/:userId", protect, getUserPurchases);
router.put("/:id/approve", protect, admin, approvePurchase);
router.put("/:id/status", protect, admin, updatePurchaseStatus);
router.put("/:id/reject", protect, admin, rejectPurchase);

module.exports = router;
