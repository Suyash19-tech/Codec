// server/utils/textExtractor.js
// Hybrid Text Extraction Pipeline - Optimized for API usage
// Priority: Local processing first, Gemini only for scanned PDFs

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

let genAI = null;

/**
 * Initialize Gemini client (lazy initialization)
 */
function initializeGemini() {
    if (genAI) return genAI;

    if (!process.env.GEMINI_API_KEY) {
        console.error('[Hybrid Extractor] ❌ GEMINI_API_KEY not set');
        return null;
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('[Hybrid Extractor] ✓ Gemini client initialized');
    return genAI;
}

/**
 * Hybrid Text Extraction with Smart Fallback
 * - Images: Local OCR (Tesseract)
 * - Digital PDFs: Local extraction (pdf-parse)
 * - Scanned PDFs: Gemini API (only when needed)
 * 
 * @param {string} fileUrl - Cloudinary URL
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Extracted text
 */
async function extractDocumentText(fileUrl, mimeType) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   HYBRID TEXT EXTRACTION PIPELINE      ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('[Hybrid Extractor] File URL:', fileUrl);
    console.log('[Hybrid Extractor] MIME Type:', mimeType);

    try {
        // Step 1: Fetch file buffer once
        console.log('[Hybrid Extractor] Step 1: Fetching file...');
        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: 50 * 1024 * 1024
        });

        const fileBuffer = Buffer.from(response.data);
        const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
        console.log(`[Hybrid Extractor] ✓ Downloaded: ${fileBuffer.length} bytes (${fileSizeMB} MB)`);

        // Step 2: Route to appropriate extraction method

        // ═══ IMAGE PROCESSING (Local OCR) ═══
        if (mimeType.startsWith('image/')) {
            console.log('[Hybrid Extractor] 📷 IMAGE detected - Using LOCAL Tesseract OCR');
            return await extractImageText(fileBuffer);
        }

        // ═══ PDF PROCESSING (Smart Fallback) ═══
        if (mimeType === 'application/pdf') {
            console.log('[Hybrid Extractor] 📄 PDF detected - Attempting LOCAL pdf-parse first...');

            try {
                const pdfData = await pdfParse(fileBuffer);
                const extractedText = (pdfData.text || '').trim();

                console.log(`[Hybrid Extractor] pdf-parse result: ${extractedText.length} characters`);

                // Check if it's a digital PDF (has readable text)
                const MIN_TEXT_THRESHOLD = 50;

                if (extractedText.length >= MIN_TEXT_THRESHOLD) {
                    console.log('[Hybrid Extractor] ✅ DIGITAL PDF - Using local extraction');
                    console.log(`[Hybrid Extractor] ✓ Extracted ${extractedText.length} chars locally (NO API COST)`);
                    console.log('╚════════════════════════════════════════╝\n');
                    return extractedText;
                }

                // Scanned PDF detected - fallback to Gemini
                console.log('[Hybrid Extractor] ⚠️ SCANNED PDF detected (< 50 chars)');
                console.log('[Hybrid Extractor] 🔄 Falling back to Gemini API...');
                return await extractWithGemini(fileBuffer, mimeType);

            } catch (pdfError) {
                console.error('[Hybrid Extractor] pdf-parse failed:', pdfError.message);
                console.log('[Hybrid Extractor] 🔄 Falling back to Gemini API...');
                return await extractWithGemini(fileBuffer, mimeType);
            }
        }

        // Unsupported file type
        console.log('[Hybrid Extractor] ⚠️ Unsupported file type');
        console.log('╚════════════════════════════════════════╝\n');
        return '';

    } catch (error) {
        console.error('[Hybrid Extractor] ❌ Fatal error:', error.message);
        console.log('╚════════════════════════════════════════╝\n');
        return '';
    }
}

/**
 * Extract text from images using local Tesseract OCR
 */
async function extractImageText(imageBuffer) {
    try {
        console.log('[Tesseract OCR] Starting local image OCR...');

        const { data } = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[Tesseract OCR] Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const extractedText = (data.text || '').trim();
        const confidence = Math.round(data.confidence);

        console.log(`[Tesseract OCR] ✅ SUCCESS - ${extractedText.length} chars (Confidence: ${confidence}%)`);
        console.log('[Tesseract OCR] ✓ NO API COST - Processed locally');
        console.log('╚════════════════════════════════════════╝\n');

        return extractedText;

    } catch (error) {
        console.error('[Tesseract OCR] ❌ Failed:', error.message);
        console.log('╚════════════════════════════════════════╝\n');
        return '';
    }
}

/**
 * Extract text using Gemini API (for scanned PDFs only)
 */
async function extractWithGemini(fileBuffer, mimeType) {
    try {
        const client = initializeGemini();
        if (!client) {
            console.error('[Gemini API] ❌ Client not initialized');
            return '';
        }

        console.log('[Gemini API] Converting to Base64...');
        const base64Data = fileBuffer.toString('base64');
        const base64SizeKB = (base64Data.length / 1024).toFixed(2);
        console.log(`[Gemini API] ✓ Base64 size: ${base64SizeKB} KB`);

        console.log('[Gemini API] Sending to Gemini 2.5 Flash...');
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            "Extract all readable text from this document. Return ONLY the extracted text without any formatting or commentary.",
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const extractedText = (result.response.text() || '').trim();

        console.log(`[Gemini API] ✅ SUCCESS - ${extractedText.length} characters`);
        console.log('[Gemini API] ⚠️ API COST INCURRED (Scanned PDF)');
        console.log('╚════════════════════════════════════════╝\n');

        return extractedText;

    } catch (error) {
        console.error('[Gemini API] ❌ Failed:', error.message);

        if (error.message.includes('API key')) {
            console.error('[Gemini API] ❌ Invalid API key');
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
            console.error('[Gemini API] ❌ Rate limit or quota exceeded');
        }

        console.log('╚════════════════════════════════════════╝\n');
        return '';
    }
}

/**
 * Check if file type is supported for extraction
 */
function isExtractionSupported(mimeType) {
    if (!mimeType) return false;

    const supportedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff'
    ];

    return supportedTypes.includes(mimeType.toLowerCase()) || mimeType.startsWith('image/');
}

module.exports = {
    extractDocumentText,
    isExtractionSupported
};
