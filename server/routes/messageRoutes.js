const express = require('express');
const router = express.Router();
const { sendPrivateMessage, getPrivateMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:docId', protect, sendPrivateMessage);
router.get('/:docId/:peerId', protect, getPrivateMessages);

module.exports = router;
