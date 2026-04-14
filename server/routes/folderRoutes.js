// server/routes/folderRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createFolder, getDirectoryContents, updateFolder, deleteFolder } = require('../controllers/folderController');

router.use(authMiddleware);

router.post('/', createFolder);
router.get('/', getDirectoryContents);
router.patch('/:folderId', updateFolder);
router.delete('/:folderId', deleteFolder);

module.exports = router;
