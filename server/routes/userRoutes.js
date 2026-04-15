const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, getMe, updateMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);

module.exports = router;
