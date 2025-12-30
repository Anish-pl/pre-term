const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// In-memory user storage (temporary)
const users = [];

// Landing page (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Signup route
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ email, password });
  console.log("✅ New user signed up:", email);

  res.json({ message: "Signup successful" });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    console.log("❌ Invalid login attempt:", email);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log("🔓 User logged in:", email);
  res.json({ message: "Login successful" });
});

//
app.post("/predict", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.json(result);

  } catch (err) {
    console.error("ML server error:", err.message);
    res.status(500).json({ error: "ML server not running" });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
