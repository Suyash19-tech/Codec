// server/controllers/folderController.js
const Folder = require('../models/Folder');
const Document = require('../models/Document');

// Create Folder
const createFolder = async (req, res) => {
    try {
        console.log('--- CREATE FOLDER REQUEST START ---');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user.id);

        const { name, parentFolder } = req.body;
        if (!name) {
            console.log('Error: Folder name is missing');
            return res.status(400).json({ message: 'Folder name is required' });
        }

        const folderData = {
            name,
            owner: req.user.id,
            parentFolder: parentFolder || null
        };
        console.log('Attempting to create folder with data:', JSON.stringify(folderData, null, 2));

        const folder = await Folder.create(folderData);
        console.log('Folder created successfully:', folder._id);

        res.status(201).json(folder);
    } catch (error) {
        console.error('Create Folder Error:', error);
        res.status(500).json({ message: 'Server error creating folder', error: error.message });
    }
};

// Get directory contents (folders and documents)
const getDirectoryContents = async (req, res) => {
    try {
        const { folderId, showHidden } = req.query;
        const parentFolder = folderId || null;
        console.log('--- GET DIRECTORY CONTENTS ---');
        console.log('Parent Folder Query:', parentFolder);

        const folderQuery = { owner: req.user.id, parentFolder };
        if (!showHidden || showHidden === 'false') {
            folderQuery.isHidden = false;
        }

        const folders = await Folder.find(folderQuery).sort({ name: 1 });
        const documents = await Document.find({ uploader: req.user.id, folderId: parentFolder }).sort({ createdAt: -1 });

        console.log(`Found ${folders.length} folders and ${documents.length} documents`);
        res.status(200).json({ folders, documents });
    } catch (error) {
        console.error('Get Directory Contents Error:', error);
        res.status(500).json({ message: 'Server error fetching directory contents' });
    }
};

// Update folder (rename or hide)
const updateFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const { name, isHidden } = req.body;

        const folder = await Folder.findOne({ _id: folderId, owner: req.user.id });
        if (!folder) return res.status(404).json({ message: 'Folder not found or unauthorized' });

        if (name !== undefined) folder.name = name;
        if (isHidden !== undefined) folder.isHidden = isHidden;

        await folder.save();
        res.status(200).json(folder);
    } catch (error) {
        console.error('Update Folder Error:', error);
        res.status(500).json({ message: 'Server error updating folder' });
    }
};

// Delete folder (Recursive/Cascading - STRICT DELETION - Bug Fix)
const deleteFolder = async (req, res) => {
    try {
        const { folderId } = req.params;

        // 1. Ensure folder exists and belongs to user
        const targetFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
        if (!targetFolder) {
            return res.status(404).json({ message: 'Folder not found or unauthorized' });
        }

        // 2. Recursive helper to get all nested sub-folder IDs
        const getAllNestedFolderIds = async (parentId) => {
            const children = await Folder.find({ parentFolder: parentId });
            let allIds = children.map(c => c._id);
            for (let child of children) {
                const nestedIds = await getAllNestedFolderIds(child._id);
                allIds = allIds.concat(nestedIds);
            }
            return allIds;
        };

        const allFolderIdsToDelete = [targetFolder._id, ...(await getAllNestedFolderIds(targetFolder._id))];

        // 3. Find all documents in these folders
        const documentsToDelete = await Document.find({ folderId: { $in: allFolderIdsToDelete } });

        // 4. Delete physical files from local filesystem
        const fs = require('fs');
        const path = require('path');
        for (let doc of documentsToDelete) {
            if (doc.fileName) {
                const filePath = path.join(__dirname, '../uploads', doc.fileName);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fileErr) {
                    console.error(`Error deleting physical file ${doc.fileName}:`, fileErr);
                }
            }
        }

        // 5. STRICT Database Deletion - Delete Document records from MongoDB
        const docDeleteResult = await Document.deleteMany({ folderId: { $in: allFolderIdsToDelete } });
        console.log(`Deleted ${docDeleteResult.deletedCount} documents from folders`);

        // 6. STRICT Database Deletion - Delete all Folder records from MongoDB
        const folderDeleteResult = await Folder.deleteMany({ _id: { $in: allFolderIdsToDelete } });
        console.log(`Deleted ${folderDeleteResult.deletedCount} folders`);

        res.status(200).json({
            message: 'Folder and all its contents deleted successfully',
            deletedFolders: folderDeleteResult.deletedCount,
            deletedDocuments: docDeleteResult.deletedCount
        });
    } catch (error) {
        console.error('Delete Folder Error:', error);
        res.status(500).json({ message: 'Server error deleting folder' });
    }
};

module.exports = { createFolder, getDirectoryContents, updateFolder, deleteFolder };
