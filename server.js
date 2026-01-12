const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require("dotenv").config();
const connectDB = require("./config/db");
const Patient = require("./models/Patient");
const Prediction = require("./models/Prediction");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


connectDB().catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
});


const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Signup route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "User already exists" });

  const hashedPwd = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashedPwd });

  res.json({ message: "Signup successful" });
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ message: "Login successful", token });
});

// Save patient data
app.post("/api/patient", async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Predict premature birth risk via your ML API
app.post("/api/predict", async (req, res) => {
  try {
    // 1️⃣ Save patient data in DB (from friend’s logic)
    const patient = await Patient.create(req.body);

    // 2️⃣ Call your ML server
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const mlResult = await response.json();

    // 3️⃣ Save prediction in DB
  const prediction = await Prediction.create({
  patient: patient._id,
  risk: mlResult.risk,
  probability: mlResult.probability  // store as received
});

// Send numeric probability for frontend
res.json({
  patient,
  prediction,
});


  } catch (err) {
    console.error("ML server error:", err.message);
    res.status(500).json({ error: "Prediction failed", details: err.message });
  }
});



//for image processing
const multer = require("multer");
// Image processing services
const { extractTextFromImage } = require("./imageprocessing/services/ocr.service.js");
const { extractModelFeatures } = require("./imageprocessing/routes/featureFilter.js");


const upload = multer({ dest: "imageprocessing/uploads/" });

app.post("/api/upload-report", upload.single("report"), async (req, res) => {
  try {
    const rawText = await extractTextFromImage(req.file.path);
    const extractedFeatures = extractModelFeatures(rawText);

    res.json({
      raw_text: rawText,
      extracted_features: extractedFeatures
    });
  } catch (err) {
    res.status(500).json({ error: "OCR failed" });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);