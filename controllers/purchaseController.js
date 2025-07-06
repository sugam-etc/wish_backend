// controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// Create a new purchase
exports.createPurchase = async (req, res) => {
  try {
    const { userId, name, email, contact, items, totalAmount, transactionId } =
      req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment proof is required",
      });
    }

    // Parse the items string back to an array
    const itemsArray = typeof items === "string" ? JSON.parse(items) : items;

    // Create the purchase
    const purchase = new Purchase({
      userId,
      name,
      email,
      contact,
      items: itemsArray,
      totalAmount,
      transactionId,
      paymentProof: req.file.path,
      status: "pending", // Explicitly set initial status
    });

    await purchase.save();

    // Update user's purchase history
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          purchaseHistory: {
            $each: itemsArray.map((item) => ({
              itemType: "product",
              itemName: item.name,
              price: item.price,
              quantity: item.quantity,
              purchaseDate: new Date(),
              details: {
                transactionId,
                status: "pending",
                purchaseId: purchase._id, // Store reference to purchase
              },
            })),
          },
        },
      },
      { new: true }
    );

    if (!user) {
      // Rollback purchase if user not found
      await purchase.remove();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(201).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating purchase",
      error: error.message,
    });
  }
};

// Get all purchases (admin only)
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get purchases for a specific user
exports.getUserPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve a purchase (admin only)
exports.approvePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Update user's purchase history status using atomic operation
    await User.updateMany(
      {
        "purchaseHistory.details.purchaseId": purchase._id,
      },
      {
        $set: {
          "purchaseHistory.$[elem].details.status": "completed",
        },
      },
      {
        arrayFilters: [{ "elem.details.purchaseId": purchase._id }],
      }
    );

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject a purchase (admin only)
exports.rejectPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Update user's purchase history status using atomic operation
    await User.updateMany(
      {
        "purchaseHistory.details.purchaseId": purchase._id,
      },
      {
        $set: {
          "purchaseHistory.$[elem].details.status": "cancelled",
        },
      },
      {
        arrayFilters: [{ "elem.details.purchaseId": purchase._id }],
      }
    );

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// General status update for purchase
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate the status
    const validStatuses = [
      "pending",
      "completed",
      "cancelled",
      "processing",
      "shipped",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Update user's purchase history status using atomic operation
    await User.updateMany(
      {
        "purchaseHistory.details.purchaseId": purchase._id,
      },
      {
        $set: {
          "purchaseHistory.$[elem].details.status": status,
        },
      },
      {
        arrayFilters: [{ "elem.details.purchaseId": purchase._id }],
      }
    );

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error updating purchase status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating purchase status",
      error: error.message,
    });
  }
};
