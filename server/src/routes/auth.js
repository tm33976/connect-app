const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, about } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const user = await User.create({ name, email, password, about });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        about: user.about,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages[0] });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Explicitly select password (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        about: user.about,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/auth/me verify token & return current user
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile update own profile
router.patch("/profile", protect, async (req, res) => {
  try {
    const { name, about } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (about !== undefined) updates.about = about;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// PATCH /api/auth/avatar upload or remove profile picture
router.patch("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (req.body.remove === "true") {
      if (user.avatar) {
        const old = path.join(__dirname, "../../uploads", user.avatar.replace(/^\/uploads\//, ""));
        fs.unlink(old, () => {});
      }
      user.avatar = null;
      await user.save();
      return res.json({ user });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    // Delete old avatar file if present
    if (user.avatar) {
      const old = path.join(__dirname, "../../uploads", user.avatar.replace(/^\/uploads\//, ""));
      fs.unlink(old, () => {});
    }

    // Store relative URL so the client can resolve it via API_BASE
    user.avatar = `/uploads/${req.file.destination.split("uploads")[1].replace(/^[\\/]/, "")}/${req.file.filename}`.replace(/\\/g, "/");
    // Normalise to /uploads/images/<filename>
    const rel = req.file.path.split("uploads")[1].replace(/\\/g, "/");
    user.avatar = `/uploads${rel}`;
    await user.save();

    res.json({ user });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Failed to update avatar." });
  }
});

module.exports = router;