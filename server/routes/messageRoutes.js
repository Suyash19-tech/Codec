const express = require('express');
const router = express.Router();
const { sendPrivateMessage, getPrivateMessages } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:docId', authMiddleware, sendPrivateMessage);
router.get('/:docId/:peerId', authMiddleware, getPrivateMessages);

module.exports = router;
