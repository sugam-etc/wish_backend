const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  purchaseMembership,
  addReward,
  updateReward,
  removeReward,
  getUsers,
  registerAdmin,
  loginAdmin,
  getUser,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", protect, admin, getUsers);
router.get("/profile", protect, getUserProfile);
// In your userRoutes.js
router.get(
  "/:userId",
  protect,
  admin,
  (req, res, next) => {
    console.log("Received GET request for user ID:", req.params.userId);
    next();
  },
  getUser
);
router.post("/register", registerUser);
router.post("/registeradmin", registerAdmin);
router.post("/login", loginUser);
router.post("/loginadmin", loginAdmin);
router.put("/profile", protect, updateUserProfile);
router.post(
  "/profile/image",
  protect,
  upload.single("profileImage"),
  uploadProfileImage
);
router.post("/membership", protect, purchaseMembership);

// Reward routes
router.post("/rewards", protect, addReward);
router.put("/rewards/:rewardId", updateReward);
// Updated route for removing a reward to include userId
router.delete("/:userId/rewards/:rewardId", protect, removeReward);
module.exports = router;
