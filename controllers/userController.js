const User = require("../models/User");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const upload = require("../middleware/uploadMiddleware");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, contactNo, email, nationality, address, password } =
    req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      fullName,
      contactNo,
      email,
      nationality,
      address,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Only for production
const registerAdmin = async (req, res) => {
  const { fullName, contactNo, email, nationality, address, password, role } =
    req.body;

  // Create new Admin
  const user = await User.create({
    fullName,
    contactNo,
    email,
    nationality,
    address,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("membership")
      .select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.fullName = req.body.fullName || user.fullName;
    user.contactNo = req.body.contactNo || user.contactNo;
    user.nationality = req.body.nationality || user.nationality;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      // Remove the uploaded file if user not found
      if (req.file) {
        fs.unlinkSync(path.join(__dirname, "../uploads", req.file.filename));
      }
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Profile image uploaded successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    // Remove the uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, "../uploads", req.file.filename));
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase membership
// @route   POST /api/users/membership
// @access  Private
const purchaseMembership = async (req, res) => {
  const { name, expiryDate, price } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.membershipInfo = {
        name,
        purchaseDate: Date.now(),
        expiryDate,
        price,
      };

      // Add to purchase history
      user.purchaseHistory.push({
        itemType: "membership",
        itemName: name,
        price,
        purchaseDate: Date.now(),
        details: {
          expiryDate,
        },
      });

      const updatedUser = await user.save();
      res.json({
        membershipInfo: updatedUser.membershipInfo,
        purchaseHistory: updatedUser.purchaseHistory,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add reward to user
// @route   POST /api/users/rewards
// @access  Private
// In your userController.js
const addReward = async (req, res) => {
  try {
    const { userId, name, description } = req.body;

    if (!userId || !name || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Use userId from body to find the target user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newReward = {
      name,
      description,
      dateEarned: new Date(),
    };

    user.rewards.push(newReward);
    await user.save();

    return res.status(201).json(newReward);
  } catch (error) {
    console.error("Error adding reward:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a reward
// @route   PUT /api/users/rewards/:rewardId
// @access  Private
const updateReward = async (req, res) => {
  const { rewardId } = req.params;
  const { name, description } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const rewardIndex = user.rewards.findIndex(
      (reward) => reward._id.toString() === rewardId
    );

    if (rewardIndex === -1) {
      return res.status(404).json({ message: "Reward not found" });
    }

    user.rewards[rewardIndex].name = name || user.rewards[rewardIndex].name;
    user.rewards[rewardIndex].description =
      description || user.rewards[rewardIndex].description;

    const updatedUser = await user.save();
    res.json(updatedUser.rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a reward
// @route   DELETE /api/users/rewards/:rewardId
// @access  Private
const removeReward = async (req, res) => {
  const { userId, rewardId } = req.params;

  try {
    // Find the user by userId from URL params
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const rewardExists = user.rewards.some(
      (r) => r._id.toString() === rewardId
    );
    if (!rewardExists) {
      return res
        .status(404)
        .json({ message: "Reward not found for this user" });
    }

    // Filter out the reward to be removed
    user.rewards = user.rewards.filter(
      (reward) => reward._id.toString() !== rewardId
    );

    const updatedUser = await user.save();
    res.json(updatedUser.rewards);
  } catch (error) {
    console.error("Error removing reward:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("membership");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};
// In your userController.js
const getUser = async (req, res) => {
  try {
    // Make sure to use req.params.userId
    const user = await User.findById(req.params.userId)
      .populate("membership")
      .select("-password")
      .lean(); // Convert to plain JavaScript object

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure rewards array exists
    if (!user.rewards) {
      user.rewards = [];
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {
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
};
