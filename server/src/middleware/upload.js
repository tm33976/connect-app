const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Determine file category from MIME type
const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "document";
};

// Cloudinary storage — files go directly to Cloudinary, no local disk 
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder:        "connect-app",
      resource_type: isVideo ? "video" : isImage ? "image" : "raw",
      public_id:     `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...(isImage && { allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"] }),
    };
  },
});

// Allowed MIME types
const ALLOWED_TYPES = {
  "image/jpeg": true, "image/png": true, "image/gif": true,
  "image/webp": true, "image/svg+xml": true,
  "video/mp4": true, "video/webm": true, "video/ogg": true, "video/quicktime": true,
  "application/pdf": true,
  "application/msword": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  "application/vnd.ms-excel": true,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
  "application/vnd.ms-powerpoint": true,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
  "text/plain": true,
  "application/zip": true,
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
  else cb(new Error(`File type '${file.mimetype}' is not allowed.`), false);
};

// Export configured multer 
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = { upload, getFileType };