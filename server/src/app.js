const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const conversationRoutes = require("./routes/conversations");

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet with relaxed CSP so uploaded images/videos load in the browser
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow cross-origin media
    contentSecurityPolicy: false, // disable CSP (frontend handles its own)
  })
);

app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});
app.use("/api/auth/", authLimiter);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Use "*" so port-forwarded URLs (mobile testing, tunnels) are never blocked.
// This is safe for a dev/personal app. Tighten in production.
const corsOptions = {
  origin: "*",
  credentials: false,  // must be false when origin is "*"
};
app.use(cors(corsOptions));

// Ensure preflight OPTIONS requests are handled for all routes
app.options("*", cors(corsOptions));

// Also open CORS on /uploads
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving ─────────────────────────────────────────────────────
// Serve uploaded files — must come AFTER the CORS middleware above
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "false");
      // Allow inline display of images/videos instead of forcing download
      res.setHeader("Content-Disposition", "inline");
      res.removeHeader("X-Frame-Options");
    },
  })
);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

module.exports = app;