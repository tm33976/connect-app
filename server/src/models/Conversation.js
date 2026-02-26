const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure unique 1 on 1 conversations between same two users
conversationSchema.index({ participants: 1 });

// find or create conversation between two users
conversationSchema.statics.findOrCreate = async function (userId1, userId2) {
  const participants = [userId1, userId2].sort(); 

  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 },
  }).populate("participants", "name email avatarColor about isOnline lastSeen")
    .populate({ path: "lastMessage", populate: { path: "sender", select: "name" } });

  if (!conversation) {
    conversation = await this.create({ participants });
    conversation = await conversation.populate("participants", "name email avatarColor about isOnline lastSeen");
  }

  return conversation;
};

module.exports = mongoose.model("Conversation", conversationSchema);
