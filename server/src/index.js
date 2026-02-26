require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket/socketManager");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to MongoDB then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Connect server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
});
