const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, 
    },
    about: {
      type: String,
      default: "Hey there! I'm using Connect.",
      maxlength: [100, "About cannot exceed 100 characters"],
      trim: true,
    },
    avatar: {
      type: String,
      default: null, 
    },
    avatarColor: {
      type: String,
      default: () => {
        const colors = ["#FF6B6B","#4ECDC4","#FFD93D","#A78BFA","#FB923C","#34D399","#60A5FA","#F472B6"];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    socketId: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.socketId;
  return obj;
};

userSchema.index({ name: "text", email: "text" });
module.exports = mongoose.model("User", userSchema);
