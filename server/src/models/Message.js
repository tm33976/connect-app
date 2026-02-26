const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      maxlength: [2000, "Message cannot exceed 2000 characters"],
      trim: true,
    },
    attachment: {
      url:          { type: String, default: null },
      originalName: { type: String, default: null },
      mimetype:     { type: String, default: null },
      size:         { type: Number, default: null },
      fileType: {
        type: String,
        enum: ["image", "video", "document", null],
        default: null,
      },
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
messageSchema.pre("validate", function (next) {
  if (!this.text && !this.attachment?.url) {
    return next(new Error("Message must have text or an attachment."));
  }
  next();
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);