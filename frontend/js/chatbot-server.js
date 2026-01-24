const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Store conversation history per socket
const conversationHistory = new Map();

// Medical knowledge base for quick/manual responses
const quickResponses = {
    greetings: {
        patterns: /^(hi|hello|hey|good morning|good evening|namaste)/i,
        response: {
            text: "Hello! I'm your preterm birth risk assistant powered by AI. I can help you understand risk factors, symptoms, prevention strategies, and guide you through our assessment tool. How can I assist you today?",
            suggestions: ["What are risk factors?", "Show symptoms", "Prevention tips", "Take assessment"]
        }
    },

    assessment: {
        patterns: /(start|take|begin).*(assess|test|predict|check)|how.*(assess|test)/i,
        response: {
            text: "I can help you with our comprehensive preterm birth risk assessment. Our tool analyzes multiple factors including:\n\n• Maternal and paternal demographics\n• Reproductive history\n• Medical conditions\n• Lifestyle factors\n• Prenatal care details\n\nWould you like to start the assessment now?",
            suggestions: ["Start assessment", "What data is needed?", "How accurate is it?"],
            action: "show_assessment_link"
        }
    },

    symptoms: {
        patterns: /symptom|sign|warning|feel/i,
        response: {
            text: "Warning signs of preterm labor include:\n\n⚠️ Regular contractions before 37 weeks\n⚠️ Lower back pain that doesn't go away\n⚠️ Pelvic pressure\n⚠️ Vaginal bleeding or spotting\n⚠️ Fluid leaking from vagina\n⚠️ Abdominal cramping\n\n**Important:** If you experience any of these symptoms, contact your healthcare provider immediately.",
            suggestions: ["What should I do?", "Risk factors", "Prevention tips"]
        }
    },

    emergency: {
        patterns: /emergency|urgent|help me|serious|dangerous/i,
        response: {
            text: "🚨 **This is a medical emergency if you're experiencing:**\n• Heavy bleeding\n• Severe pain\n• Fluid leaking\n• Reduced fetal movement\n\n**Please contact your healthcare provider immediately or call emergency services.**\n\nThis chatbot is for informational purposes only and cannot provide emergency medical care.",
            suggestions: []
        }
    }
};

// Check if message matches quick response pattern
function checkQuickResponse(message) {
    const msg = message.toLowerCase();

    for (const [key, config] of Object.entries(quickResponses)) {
        if (config.patterns.test(msg)) {
            return config.response;
        }
    }

    return null;
}

// Call Anthropic Claude API for intelligent responses
async function getAIResponse(message, conversationHistory) {
    try {
        const messages = conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add current message
        messages.push({
            role: "user",
            content: message
        });

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: `You are a medical assistant specializing in preterm birth risk assessment. Your role is to:

1. Provide accurate, evidence-based information about preterm birth
2. Explain risk factors, symptoms, and prevention strategies
3. Guide users through understanding their risk assessment
4. Be empathetic and supportive
5. Always emphasize consulting healthcare providers for medical decisions
6. Never provide direct medical diagnoses

Key information about our system:
- We have a comprehensive risk assessment tool analyzing 40+ factors
- The tool uses machine learning trained on medical datasets
- Assessment takes 5-10 minutes to complete
- Results include risk level, probability, and personalized recommendations

When users ask about:
- Risk factors: Explain maternal age, medical history, lifestyle, previous births
- Symptoms: Describe warning signs but always recommend medical consultation
- Prevention: Discuss prenatal care, nutrition, lifestyle modifications
- Assessment: Explain what data we collect and how it helps

Be concise (2-3 paragraphs max), clear, and always provide actionable next steps. Format responses with bullet points for easy reading when appropriate.`,
                messages: messages
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.content[0].text;

        // Generate contextual suggestions based on AI response
        const suggestions = generateSmartSuggestions(aiText, message);

        return {
            text: aiText,
            suggestions: suggestions,
            source: "ai"
        };

    } catch (error) {
        console.error("AI API Error:", error);

        // Fallback response if AI fails
        return {
            text: "I apologize, but I'm having trouble connecting to my AI system right now. However, I can still help you with:\n\n• Understanding preterm birth risk factors\n• Accessing our risk assessment tool\n• General information about prevention\n\nPlease try rephrasing your question, or you can take our comprehensive assessment directly.",
            suggestions: ["Take assessment", "Risk factors", "Prevention tips"],
            source: "fallback"
        };
    }
}

// Generate smart suggestions based on conversation context
function generateSmartSuggestions(aiResponse, userMessage) {
    const suggestions = [];
    const response = aiResponse.toLowerCase();
    const message = userMessage.toLowerCase();

    // Context-aware suggestions
    if (response.includes("risk factor") || response.includes("cause")) {
        suggestions.push("How can I reduce my risk?", "Take assessment");
    }

    if (response.includes("symptom") || response.includes("warning")) {
        suggestions.push("What should I do if I have symptoms?", "Prevention strategies");
    }

    if (response.includes("assess") || response.includes("evaluation")) {
        suggestions.push("Start assessment now", "What data is needed?");
    }

    if (response.includes("prevent") || response.includes("reduce")) {
        suggestions.push("Nutrition tips", "Prenatal care importance");
    }

    if (response.includes("accurate") || response.includes("reliable")) {
        suggestions.push("How does the model work?", "Take assessment");
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
        suggestions.push("Tell me more", "Take assessment", "Other questions");
    }

    // Limit to 3 suggestions
    return suggestions.slice(0, 3);
}

// Main response handler - decides between quick response or AI
async function generateResponse(message, history) {
    // First, check for quick/manual responses
    const quickResponse = checkQuickResponse(message);

    if (quickResponse) {
        console.log("📋 Using manual response");
        return { ...quickResponse, source: "manual" };
    }

    // Otherwise, use AI for intelligent response
    console.log("🤖 Using AI response");
    return await getAIResponse(message, history);
}

// WebSocket connection handling
io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // Initialize conversation history
    conversationHistory.set(socket.id, []);

    // Send welcome message
    socket.emit("bot-message", {
        text: "👋 Welcome! I'm your AI-powered preterm birth risk assistant. I combine medical knowledge with artificial intelligence to provide you with accurate, personalized information. How can I help you today?",
        suggestions: ["What are risk factors?", "Show warning signs", "Take assessment", "Prevention tips"],
        timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    socket.on("user-message", async (data) => {
        console.log(`📨 Message from ${socket.id}:`, data.message);

        const history = conversationHistory.get(socket.id) || [];

        // Add user message to history
        history.push({
            role: "user",
            content: data.message,
            timestamp: new Date().toISOString()
        });

        // Show typing indicator
        socket.emit("bot-typing", true);

        try {
            // Generate response (manual or AI)
            const response = await generateResponse(data.message, history);

            // Add bot response to history (for AI context)
            history.push({
                role: "assistant",
                content: response.text,
                timestamp: new Date().toISOString()
            });

            // Keep only last 10 messages for context (to avoid token limits)
            if (history.length > 20) {
                conversationHistory.set(socket.id, history.slice(-20));
            } else {
                conversationHistory.set(socket.id, history);
            }

            // Stop typing indicator
            socket.emit("bot-typing", false);

            // Send response with source indicator
            socket.emit("bot-message", {
                ...response,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ Response sent (source: ${response.source})`);

        } catch (error) {
            console.error("Error generating response:", error);
            socket.emit("bot-typing", false);
            socket.emit("bot-message", {
                text: "I apologize for the technical difficulty. Please try again or take our risk assessment directly.",
                suggestions: ["Try again", "Take assessment"],
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle quick replies
    socket.on("quick-reply", async (data) => {
        socket.emit("user-message-echo", {
            message: data.message,
            timestamp: new Date().toISOString()
        });

        socket.emit("bot-typing", true);

        const history = conversationHistory.get(socket.id) || [];
        const response = await generateResponse(data.message, history);

        history.push({
            role: "user",
            content: data.message,
            timestamp: new Date().toISOString()
        });

        history.push({
            role: "assistant",
            content: response.text,
            timestamp: new Date().toISOString()
        });

        conversationHistory.set(socket.id, history);

        socket.emit("bot-typing", false);
        socket.emit("bot-message", {
            ...response,
            timestamp: new Date().toISOString()
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        conversationHistory.delete(socket.id);
    });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        activeConnections: conversationHistory.size,
        aiEnabled: !!process.env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.CHATBOT_PORT || 5001;
server.listen(PORT, () => {
    console.log(`🤖 AI Chatbot WebSocket server running on http://localhost:${PORT}`);
    console.log(`🧠 AI Mode: ${process.env.ANTHROPIC_API_KEY ? 'ENABLED ✓' : 'DISABLED ✗'}`);
    console.log(`📊 Active connections will be tracked`);
});