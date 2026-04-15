
const express = require('express');
const router = express.Router();
const { createGroup, getMyGroups, addMembersToGroup, promoteToAdmin, deleteGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup);
router.get('/', protect, getMyGroups);
router.post('/:groupId/members', protect, addMembersToGroup);
router.put('/:groupId/admins', protect, promoteToAdmin);
router.delete('/:groupId', protect, deleteGroup);

module.exports = router;
