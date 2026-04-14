const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Prevent silent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

const app = express();

// 1. Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static File Serving (The Uploads Folder)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// 3. Database Connection
connectDB();

// 4. Mount Routes
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// 5. Start Server
const PORT = process.env.PORT || 5050;

app.use((err, req, res, next) => {
  console.error('💥 FATAL SERVER ERROR CAUGHT:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is officially running on port ${PORT}`);
  console.log(`📁 Server Root: ${__dirname}`);
  console.log(`✅ File Uploads mapped to: ${uploadsDir}`);
});