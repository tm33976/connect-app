const express = require("express");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// GET /api/conversations get all conversations for current user
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email avatarColor avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name" },
      })
      .sort({ lastMessageAt: -1 });

    // Add unread count for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          "readBy.user": { $ne: req.user._id },
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.json({ conversations: enriched });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
});

// POST /api/conversations start or get conversation with a user
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const conversation = await Conversation.findOrCreate(
      req.user._id,
      userId
    );

    res.json({ conversation });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation." });
  }
});

module.exports = router;
