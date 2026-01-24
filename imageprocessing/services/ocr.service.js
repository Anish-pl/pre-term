
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

module.exports = { extractTextFromImage };

