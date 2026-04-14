const Document = require('../models/Document');
const fs = require('fs');
const axios = require('axios');

const downloadFile = async (url, path) => {
    const writer = fs.createWriteStream(path);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

const processDocument = async (docId) => {
    console.log(`[OCR] Starting processing for doc: ${docId}`);
    const document = await Document.findById(docId);
    if (!document) {
        console.error(`[OCR] Document not found: ${docId}`);
        return;
    }

    await Document.findByIdAndUpdate(docId, { ocrStatus: 'processing' });

    const tempPath = `/tmp/${document.fileName}`;

    try {
        await downloadFile(document.fileUrl, tempPath);
        console.log(`[OCR] Downloaded ${document.fileName}`);

        // For now, we just mark it as completed so the frontend knows it's ready.
        // The main controller already extracted the first few pages.
        await Document.findByIdAndUpdate(docId, {
            ocrStatus: 'completed'
        });
        console.log(`[OCR] Completed processing for doc: ${docId}`);

    } catch (error) {
        console.error(`[OCR] Error processing ${docId}:`, error);
        await Document.findByIdAndUpdate(docId, { ocrStatus: 'failed' });
    } finally {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
};

module.exports = { processDocument };
