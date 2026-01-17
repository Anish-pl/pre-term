// imageprocessing/services/ocr.service.js
// // if you are using tesseract OCR


const Tesseract = require("tesseract.js");

async function extractTextFromImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  } catch (err) {
    console.error("OCR Error:", err);
    throw err;
  }
}

// ✅ CommonJS export
module.exports = { extractTextFromImage };

