require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const connectDB = require("./config/database");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);

const io = initializeSocket(server);

connectDB();

const corsOptions = {
  origin: [
    'https://sgamez.vercel.app',
    'http://localhost:3000',  
    'http://localhost:5173'  
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api", routes);
app.use(errorHandler);

const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});