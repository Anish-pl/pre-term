import express from "express";
import multer from "multer";
import { extractTextFromImage } from "../services/ocr.service.js";

const router = express.Router();
const upload = multer({ dest: "image_processing/uploads/" });

router.post("/ocr", upload.single("image"), async (req, res) => {
  console.log("OCR route hit");

  try {
    const text = await extractTextFromImage(req.file.path);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});

export default router;
