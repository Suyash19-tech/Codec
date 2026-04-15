// server/routes/folderRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createFolder, getDirectoryContents, updateFolder, deleteFolder } = require('../controllers/folderController');

router.use(protect);

router.post('/', createFolder);
router.get('/', getDirectoryContents);
router.patch('/:folderId', updateFolder);
router.delete('/:folderId', deleteFolder);

module.exports = router;
