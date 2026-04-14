// server/models/Folder.js
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    isHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);
