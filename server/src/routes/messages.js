const express = require("express");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { protect } = require("../middleware/auth");
const { upload, getFileType } = require("../middleware/upload");
const { getIO, getSocketId } = require("../socket/socketManager");
const validator = require("validator");

const router = express.Router();
router.use(protect);

router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) return res.status(403).json({ error: "Access denied." });

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Message.countDocuments({ conversationId });

    const messages = await Message.find({ conversationId })
      .populate("sender", "name avatarColor avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      messages: messages.reverse(),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      hasMore: skip + messages.length < total,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/messages send text or file
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let { conversationId, text } = req.body;
    const file = req.file;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required." });
    }
    if (!text?.trim() && !file) {
      return res.status(400).json({ error: "Message must have text or a file." });
    }

    if (text?.trim()) {
      text = validator.escape(text.trim());
      if (text.length > 2000) {
        return res.status(400).json({ error: "Message too long (max 2000 chars)." });
      }
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      if (file) fs.unlinkSync(file.path);
      return res.status(403).json({ error: "Access denied." });
    }

    let attachment = null;
    if (file) {
      const fileType = getFileType(file.mimetype);
      const relativePath = "/uploads/" + fileType + "s/" + file.filename;
      attachment = {
        url: relativePath,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileType,
      };
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: text?.trim() || "",
      ...(attachment && { attachment }),
      status: "sent",
    });

    await message.populate("sender", "name avatarColor avatar");

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    const io = getIO();
    const otherParticipantId = conversation.participants
      .find((p) => p.toString() !== req.user._id.toString())
      ?.toString();

    if (otherParticipantId) {
      const recipientSocketId = getSocketId(otherParticipantId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new_message", { message, conversationId });
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });
        message.status = "delivered";
      }
    }

    const senderSocketId = getSocketId(req.user._id.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_sent", { message, conversationId });
    }

    res.status(201).json({ message });
  } catch (err) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message || "Failed to send message." });
  }
});
router.patch("/:conversationId/read", async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        "readBy.user": { $ne: req.user._id },
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { status: "read" },
      }
    );

    const io = getIO();
    const conversation = await Conversation.findById(conversationId);
    const senderId = conversation.participants
      .find((p) => p.toString() !== req.user._id.toString())
      ?.toString();

    if (senderId) {
      const senderSocketId = getSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read", {
          conversationId,
          readBy: req.user._id,
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
});

module.exports = router;