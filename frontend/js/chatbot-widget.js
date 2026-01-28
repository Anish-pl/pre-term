// Floating Chatbot Widget JavaScript

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWidget = document.getElementById('chatbotWidget');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotBadge = document.querySelector('.chatbot-badge');
  const quickReplyBtns = document.querySelectorAll('.quick-reply-btn');

  let chatHistory = [];
  let isOpen = false;

  // Toggle chatbot open/close
  chatbotToggle.addEventListener('click', () => {
    isOpen = !isOpen;
    chatbotWidget.classList.toggle('open', isOpen);
    if (isOpen) {
      chatbotBadge.style.display = 'none';
      chatbotInput.focus();
    }
  });

  // Close button
  chatbotClose.addEventListener('click', () => {
    isOpen = false;
    chatbotWidget.classList.remove('open');
  });

  // Add message to chat
  function addMessage(text, isUser = false) {
    const welcomeMsg = document.querySelector('.welcome-chat-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typing';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Remove typing indicator
  function removeTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
  }

  // Get AI response from backend
  async function getAIResponse(message) {
    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message, 
          history: chatHistory 
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.response;
    } catch (error) {
      console.error('Chatbot Error:', error);
      return "I'm having trouble connecting right now. Please try again in a moment or check if the server is running.";
    }
  }

  // Send message function
  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatHistory.push({ role: 'user', content: message });
    
    // Clear input
    chatbotInput.value = '';
    chatbotSend.disabled = true;

    // Show typing
    showTyping();
    
    // Get AI response
    const response = await getAIResponse(message);
    removeTyping();
    
    // Add bot message
    addMessage(response);
    chatHistory.push({ role: 'assistant', content: response });
    
    // Re-enable send button
    chatbotSend.disabled = false;
    chatbotInput.focus();
  }

  // Event listener for send button
  chatbotSend.addEventListener('click', sendMessage);

  // Event listener for Enter key
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Quick reply buttons
  quickReplyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chatbotInput.value = btn.dataset.message;
      sendMessage();
    });
  });

  // Optional: Check API connection on load
  window.addEventListener('load', async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test', history: [] })
      });
      
      if (response.ok) {
        console.log('✅ Chatbot API connected successfully');
      }
    } catch (error) {
      console.warn('⚠️ Chatbot API connection failed. Please ensure server is running.');
    }
  });
});