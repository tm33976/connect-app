const multer = require("multer");
   const cloudinary = require("cloudinary").v2;
   const { CloudinaryStorage } = require("multer-storage-cloudinary");

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key:    process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
   });

   const storage = new CloudinaryStorage({
     cloudinary,
     params: (req, file) => ({
       folder: "connect-app",
       resource_type: "auto",
       public_id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
     }),
   });

   const getFileType = (mimetype) => {
     if (mimetype.startsWith("image/")) return "image";
     if (mimetype.startsWith("video/")) return "video";
     return "document";
   };

   const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

   module.exports = { upload, getFileType };