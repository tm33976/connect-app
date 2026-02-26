const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/users?search=john
// Returns all registered users (excluding self), optionally filtered by name/email
router.get("/", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;

    const query = {
      _id: { $ne: req.user._id }, 
    };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email about avatarColor avatar isOnline lastSeen createdAt")
      .sort({ isOnline: -1, name: 1 }) 
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// GET /api/users/:id get a specific user's public profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email about avatarColor avatar isOnline lastSeen createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user." });
  }
});

module.exports = router;
