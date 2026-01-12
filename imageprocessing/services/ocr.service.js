// imageprocessing/services/ocr.service.js
import Tesseract from "tesseract.js"; // if you are using tesseract OCR

export async function extractTextFromImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  } catch (err) {
    console.error("OCR Error:", err);
    throw err;
  }
}
