const express = require('express');
const router = express.Router();
const { uploadDocuments, getMyDocuments, searchDocuments, deleteDocument, getPublicUserDocuments, toggleDocumentPrivacy, shareDocument, getSharedDocuments } = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/documents/search - Search documents
router.get('/search', authMiddleware, searchDocuments);

// GET /api/documents/shared - Get shared with me
router.get('/shared', authMiddleware, getSharedDocuments);

// GET /api/documents/user/:userId/public - Get public documents for a user
router.get('/user/:userId/public', authMiddleware, getPublicUserDocuments);

// PATCH /api/documents/:id/privacy - Toggle document privacy
router.patch('/:id/privacy', authMiddleware, toggleDocumentPrivacy);

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', authMiddleware, deleteDocument);

// GET /api/documents - Fetch user's docs
router.get('/', authMiddleware, getMyDocuments);

// POST /api/documents/:id/share - Share document
router.post('/:id/share', authMiddleware, shareDocument);

// POST /api/documents/upload - Direct JSON metadata upload
router.post('/upload', authMiddleware, uploadDocuments);

module.exports = router;
