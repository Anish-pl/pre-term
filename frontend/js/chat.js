const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const questionChips = document.querySelectorAll('.question-chip');

// Conversation history for context
let chatHistory = [];

// Add message to chat
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = content.replace(/\n/g, '<br>');
  
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.id = 'typing';
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

// Call backend API to get AI response from Groq
async function getAIResponse(question) {
  try {
    const response = await fetch('http://localhost:5000/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question,
        history: chatHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we got an error response
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.response;

  } catch (error) {
    console.error('❌ AI API Error:', error);
    return `❌ Unable to connect to Groq AI service.\n\nPossible issues:\n• Server is not running on port 5000\n• GROQ_API_KEY is missing in .env file\n• No internet connection\n• API quota exceeded\n\nError details: ${error.message}\n\nPlease check the server console for more information.`;
  }
}

// Handle sending message
async function sendMessage() {
  const question = messageInput.value.trim();
  if (!question) return;

  // Remove welcome message if exists
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  // Add user message
  addMessage(question, true);
  chatHistory.push({ role: 'user', content: question });
  
  messageInput.value = '';
  sendBtn.disabled = true;
  
  // Show typing indicator
  showTyping();

  // ALWAYS use Groq API for ALL questions
  try {
    const aiAnswer = await getAIResponse(question);
    removeTyping();
    addMessage(aiAnswer);
    chatHistory.push({ role: 'assistant', content: aiAnswer });
  } catch (error) {
    removeTyping();
    addMessage(`❌ Error: ${error.message}`);
  }

  sendBtn.disabled = false;
  messageInput.focus();
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

questionChips.forEach(chip => {
  chip.addEventListener('click', () => {
    messageInput.value = chip.dataset.question;
    sendMessage();
  });
});

// Focus input on load
messageInput.focus();

// Optional: Add connection status indicator
window.addEventListener('load', async () => {
  try {
    const response = await fetch('http://localhost:5000/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', history: [] })
    });
    
    if (response.ok) {
      console.log('✅ Connected to Groq AI successfully');
    }
  } catch (error) {
    console.warn('⚠️ Cannot connect to server. Please ensure server is running.');
  }
});