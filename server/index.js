require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api', routes);
app.use(errorHandler);

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});