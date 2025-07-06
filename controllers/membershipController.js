// controllers/membershipController.js
const Membership = require("../models/Membership");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// @desc    Purchase a membership
// @route   POST /api/memberships
// @access  Private
const purchaseMembership = async (req, res) => {
  const { name, duration, price, paymentMethod, transactionId, autoRenew } =
    req.body;

  try {
    // 1. Calculate expiry date FIRST
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);

    if (duration === "1 month") expiryDate.setMonth(expiryDate.getMonth() + 1);
    else if (duration === "3 months")
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    else if (duration === "6 months")
      expiryDate.setMonth(expiryDate.getMonth() + 6);
    else if (duration === "12 months")
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // 2. Now create membership with the calculated expiryDate
    const membership = await Membership.create({
      name,
      expiryDate, // ← Now properly defined
      price,
      userId: req.user._id,
      paymentMethod,
      transactionId,
      transactionProof: req.file ? `/uploads/${req.file.filename}` : null,
      autoRenew,
      status: "pending",
      purchaseDate, // ← Also good practice to record
    });

    // 3. Update user with the same expiryDate
    await User.findByIdAndUpdate(req.user._id, {
      membership: membership._id,
      $push: {
        purchaseHistory: {
          itemType: "membership",
          itemName: name,
          price,
          purchaseDate,
          details: {
            expiryDate, // ← Now available
            duration,
            status: "pending",
          },
        },
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, "../uploads", req.file.filename));
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a membership
// @route   PUT /api/memberships/:id/verify
// @access  Private/Admin
const verifyMembership = async (req, res) => {
  try {
    const { verificationNotes } = req.body;

    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    membership.verified = true;
    membership.status = "active";
    membership.verificationNotes = verificationNotes || "";
    await membership.save();

    // Update user's membership reference and status in purchase history
    await User.findByIdAndUpdate(
      membership.userId,
      {
        membership: membership._id,
        $set: {
          "purchaseHistory.$[elem].details.status": "active",
        },
      },
      {
        arrayFilters: [
          {
            "elem.itemType": "membership",
            "elem._id": membership._id,
          },
        ],
      }
    );

    res.json({
      message: "Membership verified and activated",
      membership,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a membership
// @route   PUT /api/memberships/:id/reject
// @access  Private/Admin
const rejectMembership = async (req, res) => {
  try {
    const { verificationNotes } = req.body;

    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    membership.verified = false;
    membership.status = "cancelled";
    membership.verificationNotes = verificationNotes || "";
    await membership.save();

    // Update user's membership status in purchase history
    await User.findByIdAndUpdate(
      membership.userId,
      {
        $set: {
          membership: null,
          "purchaseHistory.$[elem].details.status": "cancelled",
        },
      },
      {
        arrayFilters: [
          {
            "elem.itemType": "membership",
            "elem._id": membership._id,
          },
        ],
      }
    );

    res.json({
      message: "Membership rejected",
      membership,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending memberships for verification
// @route   GET /api/memberships/pending
// @access  Private/Admin
const getPendingMemberships = async (req, res) => {
  try {
    const pendingMemberships = await Membership.find({ status: "pending" })
      .populate("userId", "fullName email contactNo profileImage")
      .sort({ createdAt: 1 });

    res.json(pendingMemberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active memberships
// @route   GET /api/memberships/active
// @access  Private/Admin
const getActiveMemberships = async (req, res) => {
  try {
    const activeMemberships = await Membership.find({
      status: "active",
      expiryDate: { $gt: new Date() },
      verified: true,
    }).populate("userId", "fullName email contactNo profileImage");

    res.json(activeMemberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all memberships with filters
// @route   GET /api/memberships
// @access  Private/Admin
const getAllMemberships = async (req, res) => {
  try {
    const { status, verified, name, sort } = req.query;

    const query = {};
    if (status) query.status = status;
    if (verified) query.verified = verified === "true";
    if (name) query.name = name;

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "expiring") sortOption = { expiryDate: 1 };
    if (sort === "priceHigh") sortOption = { price: -1 };
    if (sort === "priceLow") sortOption = { price: 1 };

    const memberships = await Membership.find(query)
      .sort(sortOption)
      .populate("userId", "fullName email contactNo profileImage");

    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a membership
// @route   PUT /api/memberships/:id/cancel
// @access  Private
const cancelMembership = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    membership.status = "cancelled";
    membership.autoRenew = false;
    await membership.save();

    // Remove membership reference from user
    await User.findByIdAndUpdate(req.user._id, { membership: null });

    res.json({ message: "Membership cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    // Optional: Add any business logic checks here
    // For example, prevent deletion of active memberships:
    // if (membership.status === "active") {
    //   return res.status(400).json({
    //     message: "Cannot delete active membership",
    //     code: "ACTIVE_MEMBERSHIP_DELETION_NOT_ALLOWED",
    //   });
    // }

    await membership.deleteOne(); // or membership.remove() depending on Mongoose version

    res.status(200).json({
      message: "Membership deleted successfully",
      deletedMembership: membership,
    });
  } catch (error) {
    console.error("Server error deleting membership:", error);
    res.status(500).json({
      message: "Server error while deleting membership",
      error: error.message,
    });
  }
};

module.exports = {
  purchaseMembership,
  verifyMembership,
  rejectMembership,
  getPendingMemberships,
  getActiveMemberships,
  getAllMemberships,
  cancelMembership,
  deleteMembership,
};
