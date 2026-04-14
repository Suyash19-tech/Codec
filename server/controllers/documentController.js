// server/controllers/documentController.js
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Group = require('../models/Group');
const fs = require('fs');
const axios = require('axios');
const { extractDocumentText, isExtractionSupported } = require('../utils/textExtractor');

// 1. Save document metadata from Cloudinary with Gemini text extraction
const uploadDocuments = async (req, res) => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         DOCUMENT UPLOAD CONTROLLER - START                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Log incoming request body
        console.log('[Upload Controller] Incoming req.body:', JSON.stringify(req.body, null, 2));

        const { originalName, fileUrl, cloudinaryId, size, tags, folderId, webkitRelativePath } = req.body;

        if (!fileUrl || !cloudinaryId) {
            console.error('[Upload Controller] ❌ Missing required fields: fileUrl or cloudinaryId');
            return res.status(400).json({ message: 'Cloudinary URL and ID are required.' });
        }

        console.log('[Upload Controller] ✓ Required fields present');
        console.log('[Upload Controller] File:', originalName);
        console.log('[Upload Controller] URL:', fileUrl);

        // Extract tags
        let tagsArray = [];
        if (tags) {
            tagsArray = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim().toLowerCase()) : tags;
        }

        let baseFolderId = folderId;
        if (baseFolderId === 'null' || baseFolderId === 'undefined' || !baseFolderId) {
            baseFolderId = null;
        }

        const Folder = require('../models/Folder'); // Import Folder model for auto-hierarchy
        let finalFolderId = baseFolderId;

        // Auto-Folder Creation Logic (for Folder Uploads)
        if (webkitRelativePath) {
            console.log('[Upload Controller] Processing folder hierarchy:', webkitRelativePath);
            const pathParts = webkitRelativePath.split('/');
            pathParts.pop(); // Remove filename

            let currentParentId = baseFolderId;

            for (const folderName of pathParts) {
                let folder = await Folder.findOne({
                    name: folderName,
                    owner: req.user.id,
                    parentFolder: currentParentId
                });

                if (!folder) {
                    folder = await Folder.create({
                        name: folderName,
                        owner: req.user.id,
                        parentFolder: currentParentId
                    });
                }
                currentParentId = folder._id;
            }
            finalFolderId = currentParentId;
        }

        // Determine MIME type from filename extension
        const lowerName = originalName.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (lowerName.endsWith('.png')) mimeType = 'image/png';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lowerName.endsWith('.gif')) mimeType = 'image/gif';
        else if (lowerName.endsWith('.bmp')) mimeType = 'image/bmp';
        else if (lowerName.endsWith('.tiff') || lowerName.endsWith('.tif')) mimeType = 'image/tiff';
        else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
        else if (lowerName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        console.log('[Upload Controller] Detected MIME type:', mimeType);

        // Universal Text Extraction using Google Gemini 1.5 Flash
        // Privacy Control: Skip extraction if document is marked as confidential
        console.log('\n--- TEXT EXTRACTION PHASE ---');
        let extractedText = '';

        // Check if document is marked as confidential
        const isConfidential = req.body.isConfidential === true || req.body.isConfidential === 'true';
        console.log('[Upload Controller] isConfidential flag:', isConfidential);
        console.log('[Upload Controller] Raw isConfidential value:', req.body.isConfidential);

        if (isConfidential) {
            console.log('[Upload Controller] 🔒 Document marked as CONFIDENTIAL - skipping text extraction for privacy');
            extractedText = '';
        } else if (isExtractionSupported(mimeType)) {
            console.log(`[Upload Controller] ✓ MIME type supported for extraction`);
            console.log(`[Upload Controller] 🚀 Starting Gemini text extraction for: ${originalName}`);

            try {
                extractedText = await extractDocumentText(fileUrl, mimeType);

                console.log('[Upload Controller] Extraction returned, checking result...');
                console.log('[Upload Controller] Extracted text type:', typeof extractedText);
                console.log('[Upload Controller] Extracted text length:', extractedText ? extractedText.length : 0);

                if (extractedText && extractedText.length > 0) {
                    console.log(`[Upload Controller] ✅ Successfully extracted ${extractedText.length} characters`);
                    console.log(`[Upload Controller] First 50 chars: "${extractedText.substring(0, 50)}..."`);
                } else {
                    console.log(`[Upload Controller] ⚠️ No text extracted (returned empty string)`);
                }
            } catch (extractError) {
                console.error('[Upload Controller] ❌ Text extraction error:', extractError.message);
                console.error('[Upload Controller] Error stack:', extractError.stack);
                // Continue without text extraction - don't fail the upload
                extractedText = '';
            }
        } else {
            console.log(`[Upload Controller] ⚠️ Text extraction not supported for MIME type: ${mimeType}`);
            extractedText = '';
        }

        console.log('\n--- DATABASE SAVE PHASE ---');

        // Prepare document object
        const documentData = {
            originalName,
            fileName: cloudinaryId,
            fileUrl,
            mimeType,
            size: size || 0,
            uploader: req.user.id,
            folderId: finalFolderId,
            tags: tagsArray,
            extractedText: extractedText, // Store extracted text for search
            ocrStatus: 'none'
        };

        console.log('[Upload Controller] Document data to save:');
        console.log(JSON.stringify({
            ...documentData,
            extractedText: extractedText ? `${extractedText.length} characters` : 'empty',
            uploader: documentData.uploader.toString()
        }, null, 2));

        const newDoc = await Document.create(documentData);

        console.log('[Upload Controller] ✅ Document saved to MongoDB');
        console.log('[Upload Controller] Document ID:', newDoc._id);
        console.log('[Upload Controller] Saved extractedText length:', newDoc.extractedText ? newDoc.extractedText.length : 0);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║         DOCUMENT UPLOAD CONTROLLER - SUCCESS               ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        res.status(201).json(newDoc);
    } catch (error) {
        console.error('Save Document Error:', error);
        res.status(500).json({ message: 'Server error saving document metadata', error: error.message });
    }
};

// 2. Get documents for the logged-in user
const getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ uploader: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(documents);
    } catch (error) {
        console.error('Fetch Documents Error:', error);
        res.status(500).json({ message: 'Server error fetching documents' });
    }
};

// 3. Search documents (STRICT QUERY - Bug Fix)
const searchDocuments = async (req, res) => {
    try {
        console.log("Search Query Params:", req.query);
        const { q, tags, time, privacy } = req.query;

        // Base Query: STRICTLY the logged-in user's documents that exist in the database
        // This ensures deleted documents never appear
        let query = {
            uploader: req.user.id,
            // Explicitly ensure the document exists (not soft-deleted or marked for deletion)
        };

        // Privacy Filter Logic
        if (privacy === 'public') query.isPublic = true;
        if (privacy === 'private') query.isPublic = false;

        if (q) {
            console.log("Searching for query:", q);
            // Search in both filename and extracted text content
            query.$or = [
                { originalName: { $regex: q, $options: 'i' } },
                { extractedText: { $regex: q, $options: 'i' } }
            ];
        }

        if (tags) {
            query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) };
        }

        if (time && time !== 'all') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(time));
            query.createdAt = { $gte: cutoff };
        }

        // Fetch documents - Use lean() for better performance and to get plain objects
        let documents = await Document.find(query).sort({ createdAt: -1 }).lean();

        console.log(`Found ${documents.length} documents matching search criteria`);

        // Resolve full folder paths for each document
        const Folder = require('../models/Folder');

        // Cache to avoid hitting DB for the same folder multiple times
        const folderCache = {};

        const buildFolderPath = async (folderId) => {
            if (!folderId) return [];

            const path = [];
            let currentId = folderId.toString();

            while (currentId) {
                if (!folderCache[currentId]) {
                    const folder = await Folder.findById(currentId).lean();
                    if (!folder) break;
                    folderCache[currentId] = folder;
                }

                const f = folderCache[currentId];
                // Insert at beginning to build from root to child
                path.unshift({ _id: f._id, name: f.name });
                currentId = f.parentFolder ? f.parentFolder.toString() : null;
            }

            return path;
        };

        // Attach resolved paths to documents
        for (let i = 0; i < documents.length; i++) {
            if (documents[i].folderId) {
                documents[i].folderPath = await buildFolderPath(documents[i].folderId);
            } else {
                documents[i].folderPath = [];
            }
        }

        res.status(200).json(documents);
    } catch (error) {
        console.error('Search Documents Error:', error);
        res.status(500).json({ message: 'Server error searching documents' });
    }
};

// 4. Delete document (STRICT DELETION - Bug Fix)
const deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;

        // Security Check: Find the document ensuring it belongs to the logged-in user
        const document = await Document.findOne({ _id: documentId, uploader: req.user.id });
        if (!document) {
            return res.status(404).json({ message: 'Document not found or unauthorized to delete.' });
        }

        // Physical Deletion (if stored locally)
        const path = require('path');
        const filePath = path.join(__dirname, '../uploads', document.fileName);

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileErr) {
            console.error('File deletion error:', fileErr);
            // We don't crash here; if the file is already missing, we still want to delete the DB record
        }

        // STRICT Database Deletion - Use deleteOne to ensure complete removal
        const deleteResult = await Document.deleteOne({ _id: documentId, uploader: req.user.id });

        if (deleteResult.deletedCount === 0) {
            return res.status(500).json({ message: 'Failed to delete document from database.' });
        }

        console.log(`Document ${documentId} successfully deleted from database`);
        res.status(200).json({ message: 'Document successfully deleted.' });
    } catch (error) {
        console.error('Delete Document Error:', error);
        res.status(500).json({ message: 'Server error deleting document' });
    }
};

// 5. Get public documents for a specific user
const getPublicUserDocuments = async (req, res) => {
    try {
        const { userId } = req.params;
        const { q } = req.query;

        let query = { uploader: userId, isPublic: true };

        if (q) {
            query.$or = [
                { originalName: { $regex: q, $options: 'i' } },
                { extractedText: { $regex: q, $options: 'i' } }
            ];
        }

        const documents = await Document.find(query).sort({ createdAt: -1 });
        res.status(200).json(documents);
    } catch (error) {
        console.error('Get Public User Documents Error:', error);
        res.status(500).json({ message: 'Server error fetching public documents' });
    }
};

// 6. Toggle document privacy
const toggleDocumentPrivacy = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublic } = req.body;

        // Security Check: Ensure only the owner can change privacy
        const document = await Document.findOne({ _id: id, uploader: req.user.id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found or unauthorized.' });
        }

        document.isPublic = isPublic;
        await document.save();

        res.status(200).json(document);
    } catch (error) {
        console.error('Toggle Privacy Error:', error);
        res.status(500).json({ message: 'Server error updating document privacy' });
    }
};

// 9. Share document
const shareDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetUserId, targetGroupId, shareWithDepartment } = req.body;

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        // Security Check: Only owner can share
        if (document.uploader.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to share this document.' });
        }

        const sender = await User.findById(req.user.id);

        if (targetUserId) {
            // Check if already shared
            if (!document.sharedWith.includes(targetUserId)) {
                document.sharedWith.push(targetUserId);

                // Create Notification
                await Notification.create({
                    recipient: targetUserId,
                    sender: req.user.id,
                    document: id,
                    message: `${sender.name} shared a document with you: "${document.originalName}"`
                });
            }
        }

        if (targetGroupId) {
            const group = await Group.findById(targetGroupId);
            if (!group) return res.status(404).json({ message: 'Group not found.' });

            // Share with all group members except uploader
            const notifications = [];
            group.members.forEach(memberId => {
                const mid = memberId.toString();
                if (mid !== req.user.id && !document.sharedWith.includes(mid)) {
                    document.sharedWith.push(mid);
                    notifications.push({
                        recipient: mid,
                        sender: req.user.id,
                        document: id,
                        message: `${sender.name} shared a document with your group "${group.name}": "${document.originalName}"`
                    });
                }
            });

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        if (shareWithDepartment !== undefined) {
            document.departmentShare = shareWithDepartment;
        }

        await document.save();
        res.status(200).json({ message: 'Document shared successfully.', document });
    } catch (error) {
        console.error('Share Document Error:', error);
        res.status(500).json({ message: 'Server error sharing document' });
    }
};

// 10. Get shared documents
const getSharedDocuments = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const { time, type, uploaderId } = req.query;

        // Shared directly with me OR shared with my department
        let query = {
            uploader: { $ne: req.user.id }, // Not my own document
            $or: [
                { sharedWith: req.user.id }
            ]
        };

        if (user.department) {
            // Find other users in the same department
            const deptUsers = await User.find({ department: user.department, _id: { $ne: req.user.id } }).select('_id');
            const deptUserIds = deptUsers.map(u => u._id);

            query.$or.push({
                uploader: { $in: deptUserIds },
                departmentShare: true
            });
        }

        // Apply filters
        if (uploaderId) {
            query.uploader = uploaderId;
        }

        if (time && time !== 'all') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(time));
            query.createdAt = { $gte: cutoff };
        }

        if (type && type !== 'all') {
            if (type === 'pdf') query.mimeType = { $regex: 'pdf', $options: 'i' };
            else if (type === 'image') query.mimeType = { $regex: 'image', $options: 'i' };
            else if (type === 'doc') query.mimeType = { $regex: 'officedocument|msword|word', $options: 'i' };
        }

        const documents = await Document.find(query)
            .populate('uploader', 'name designation department profilePic')
            .sort({ createdAt: -1 });

        res.status(200).json(documents);
    } catch (error) {
        console.error('Get Shared Documents Error:', error);
        res.status(500).json({ message: 'Server error fetching shared documents' });
    }
};

module.exports = { uploadDocuments, getMyDocuments, searchDocuments, deleteDocument, getPublicUserDocuments, toggleDocumentPrivacy, shareDocument, getSharedDocuments };