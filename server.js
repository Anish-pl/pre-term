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

const connectDB = require("./config/db");
const Patient = require("./models/Patient");
const Prediction = require("./models/Prediction");
const User = require("./models/User");

const { extractTextFromImage } = require("./imageprocessing/services/ocr.service.js");
const { extractModelFeatures } = require("./imageprocessing/routes/featureFilter.js");

connectDB().catch(err =>
  console.error("❌ MongoDB connection failed:", err.message)
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "frontend")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});



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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});



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



// Replace your entire /api/predict endpoint in server.js with this:

app.post("/api/predict", async (req, res) => {
  console.log("🔔 /api/predict endpoint HIT!");  // ← ADD THIS LINE
  console.log("Request body:", req.body);         // ← ADD THIS LINE
  try {
    // Save patient data to MongoDB
    const patient = await Patient.create(req.body);

    // Call the ML API (FastAPI backend)
    const mlRes = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const mlResult = await mlRes.json();

    // Log the full ML response for debugging
    console.log("=== ML API RESPONSE ===");
    console.log("Prediction:", mlResult.prediction);
    console.log("Probability:", mlResult.probability);
    console.log("Has analysis:", !!mlResult.analysis);
    console.log("Has recommendations:", mlResult.analysis?.recommendations?.length || 0);

    // Save prediction to MongoDB
    const prediction = await Prediction.create({
      patient: patient._id,
      risk: mlResult.risk,
      probability: mlResult.probability
    });

    // ✅ CRITICAL: Return the FULL ML result including analysis
    // This is what the frontend needs for recommendations and dashboard
    res.json({
      // Basic prediction info
      prediction: mlResult.prediction,
      risk: mlResult.risk,
      probability: mlResult.probability,
      risk_cluster: mlResult.risk_cluster,

      // ⭐ THE COMPLETE ANALYSIS FROM RECOMMENDATION ENGINE ⭐
      analysis: mlResult.analysis,

      // Optional: Include database IDs for future reference
      patient_id: patient._id,
      prediction_id: prediction._id
    });

  } catch (err) {
    console.error("❌ Prediction error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({
      error: "Prediction failed",
      details: err.message
    });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-13b", // ✅ updated to a currently supported model
        messages: [
          { role: "system", content: "You are a medical assistant specialized in pregnancy and preterm birth. Always give safe, cautious advice and recommend seeing a doctor." },
          { role: "user", content: message }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();

    // Handle API errors safely
    if (data.error) {
      console.error("Invalid API response:", data);
      return res.status(500).json({ reply: "⚠️ AI service returned an error: " + data.error.message });
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected AI response:", data);
      return res.status(500).json({ reply: "⚠️ AI service returned unexpected response." });
    }

    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ reply: "hello how can i help you" });
  }
});

// ==================== CHATBOT ENDPOINT (GROQ API - WORKING) ====================
app.post("/api/chatbot", async (req, res) => {
  const { message, history } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY not found in environment variables");
      return res.status(500).json({ 
        error: "API key not configured. Please add GROQ_API_KEY to .env file" 
      });
    }

    // Build messages array for Groq API
    const messages = [
      {
        role: "system",
        content: `You are a knowledgeable and compassionate medical assistant specializing in preterm birth and pregnancy health.

Your responsibilities:
- Provide accurate, evidence-based information about preterm birth, pregnancy, and maternal health
- Explain risk factors, prevention strategies, and warning signs clearly
- Offer emotional support and reassurance to expectant mothers
- Answer ANY questions with expertise (not limited to pregnancy topics)
- Keep responses concise (2-4 paragraphs maximum)
- Use simple, easy-to-understand language
- For medical advice, always recommend consulting healthcare providers

Important: You provide general information, not a replacement for professional medical advice.`
      }
    ];

    // Add conversation history for context
    if (history && history.length > 0) {
      const recentHistory = history.slice(-8); // Last 4 exchanges
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message
    });

    console.log("🔄 Calling Groq API...");

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Current working model// Fast and powerful model
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Groq API Error:", errorData);
      
      if (errorData.error?.message?.includes('Invalid API Key')) {
        return res.status(401).json({ 
          error: "Invalid API key. Please check your GROQ_API_KEY in .env file" 
        });
      }
      
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Validate response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Unexpected Groq response:", data);
      throw new Error("Invalid response from Groq API");
    }

    let aiResponse = data.choices[0].message.content.trim();
    
    // Clean up the response
    aiResponse = cleanAIResponse(aiResponse);

    console.log("✅ Groq API response received successfully");
    console.log(`📝 Response length: ${aiResponse.length} characters`);
    console.log(`🤖 Model used: ${data.model}`);
    
    res.json({ response: aiResponse });

  } catch (error) {
    console.error("❌ Chatbot error:", error.message);
    
    res.status(500).json({ 
      error: `AI service error: ${error.message}. Please check your API key and try again.`
    });
  }
});

// Helper function to clean AI responses
function cleanAIResponse(text) {
  // Remove excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Remove markdown formatting for cleaner display
  text = text.replace(/\*\*/g, '');
  text = text.replace(/\*/g, '');
  
  // Trim whitespace
  text = text.trim();
  
  // Add medical disclaimer if needed
  const hasMedicalTerms = /pregnancy|birth|medical|health|symptoms|treatment|diagnosis|preterm|prenatal|trimester|labor|delivery|medication|disease/i.test(text);
  const hasDisclaimer = /consult|doctor|healthcare provider|medical professional|see a doctor|speak with|contact your/i.test(text);
  
  if (hasMedicalTerms && !hasDisclaimer) {
    text += '\n\nNote: Please consult your healthcare provider for personalized medical advice.';
  }
  
  return text;
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("GROQ KEY:", process.env.GROQ_API_KEY);

});