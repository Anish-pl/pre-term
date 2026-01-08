import Tesseract from "tesseract.js";

/**
 * Extract raw text from image
 */
export async function extractRawText(imagePath) {
  const { data } = await Tesseract.recognize(
    imagePath,
    "eng",
    { logger: m => console.log(m.status) }
  );
  return data.text;
}
