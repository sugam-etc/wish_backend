// routes/membershipRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  purchaseMembership,
  verifyMembership,
  rejectMembership,
  getPendingMemberships,
  deleteMembership,
  getActiveMemberships,
  getAllMemberships,
  cancelMembership,
} = require("../controllers/membershipController");
const { protect, admin } = require("../middleware/authMiddleware");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config like your blog example
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "proof-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Route using direct multer upload
router.post(
  "/",
  protect,
  upload.single("transactionProof"),
  purchaseMembership
);
router.put("/:id/verify", protect, admin, verifyMembership);
router.put("/:id/reject", protect, admin, rejectMembership);
router.get("/pending", protect, admin, getPendingMemberships);
router.get("/active", protect, admin, getActiveMemberships);
router.get("/", protect, admin, getAllMemberships);
router.put("/:id/cancel", protect, cancelMembership);
router.delete("/:id", protect, admin, deleteMembership); // Add this route

module.exports = router;
