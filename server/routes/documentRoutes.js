const express = require('express');
const router = express.Router();
const { uploadDocuments, getMyDocuments, searchDocuments, deleteDocument, getPublicUserDocuments, toggleDocumentPrivacy, shareDocument, getSharedDocuments } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/documents/search - Search documents
router.get('/search', protect, searchDocuments);

// GET /api/documents/shared - Get shared with me
router.get('/shared', protect, getSharedDocuments);

// GET /api/documents/user/:userId/public - Get public documents for a user
router.get('/user/:userId/public', protect, getPublicUserDocuments);

// PATCH /api/documents/:id/privacy - Toggle document privacy
router.patch('/:id/privacy', protect, toggleDocumentPrivacy);

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', protect, deleteDocument);

// GET /api/documents - Fetch user's docs
router.get('/', protect, getMyDocuments);

// POST /api/documents/:id/share - Share document
router.post('/:id/share', protect, shareDocument);

// POST /api/documents/upload - Direct JSON metadata upload
router.post('/upload', protect, uploadDocuments);

module.exports = router;
