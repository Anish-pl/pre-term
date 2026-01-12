const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

require("dotenv").config();

// DB
const connectDB = require("./config/db");
const Patient = require("./models/Patient");
const Prediction = require("./models/Prediction");
const User = require("./models/User");

// OCR services
const { extractTextFromImage } = require("./imageprocessing/services/ocr.service.js");
const { extractModelFeatures } = require("./imageprocessing/routes/featureFilter.js");

connectDB().catch(err =>
  console.error("❌ MongoDB connection failed:", err.message)
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


// ====================== AUTH ======================

// Signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ message: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ email, password: hash });

  res.json({ message: "Signup successful" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});


// ====================== OCR ======================

const upload = multer({ dest: "imageprocessing/uploads/" });

app.post("/api/upload-report", upload.single("report"), async (req, res) => {
  try {
    const rawText = await extractTextFromImage(req.file.path);
    const features = extractModelFeatures(rawText);

    res.json({
      raw_text: rawText,
      extracted_features: features
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});


// ====================== PREDICTION ======================

app.post("/api/predict", async (req, res) => {
  try {
    // 1️⃣ Save patient
    const patient = await Patient.create(req.body);

    // 2️⃣ Call ML API
    const mlRes = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const mlResult = await mlRes.json();

    // 3️⃣ Save prediction
    const prediction = await Prediction.create({
      patient: patient._id,
      risk: mlResult.risk,
      probability: mlResult.probability
    });

    res.json({ patient, prediction });
  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});


// ====================== START SERVER ======================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
