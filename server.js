const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const Patient = require("./models/Patient");
const Prediction = require("./models/Prediction");



require("dotenv").config();
const connectDB = require("./config/db");
connectDB();
const app = express();
const User = require("./models/User");
const bcrypt = require("bcryptjs"); //for signup
const jwt = require("jsonwebtoken"); //for login
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));



// Landing page (index.html)
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
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ message: "Login successful", token });
});
//this module is for
// Save patient data
app.post("/api/patient", async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Predict premature birth risk (mock ML)
app.post("/api/predict", async (req, res) => {
  try {
    // 1️⃣ Save patient data
    const patient = await Patient.create(req.body);

    // 2️⃣ Mock ML response (temporary)
    const mlResponse = {
      risk: "High",
      probability: 0.78
    };

    // 3️⃣ Save prediction result
    const prediction = await Prediction.create({
      patient: patient._id,
      risk: mlResponse.risk,
      probability: mlResponse.probability
    });

    // 4️⃣ Return result
    res.json({
      patient,
      prediction
    });

  } catch (error) {
    res.status(500).json({ message: "Prediction failed", error });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
