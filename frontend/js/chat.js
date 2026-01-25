const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const questionChips = document.querySelectorAll(".question-chip");

// Manual Q&A database (same as your existing one)
const manualQA = {
  "what is preterm birth": {
    answer: "Preterm birth (also called premature birth) is when a baby is born before 37 weeks of pregnancy...",
    keywords: ["preterm", "premature", "early birth", "what is"]
  },
  "what are the risk factors": {
    answer: "Key risk factors for preterm birth include...",
    keywords: ["risk", "factors", "causes"]
  }
  // ...add the rest of your manual QA here
};

function findManualAnswer(question) {
  const q = question.toLowerCase().trim();
  for (const [key, value] of Object.entries(manualQA)) {
    if (q.includes(key)) return value.answer;
    for (const keyword of value.keywords) if (q.includes(keyword)) return value.answer;
  }
  return null;
}

function addMessage(content, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML = content.replace(/\n/g, "<br>");
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot";
  typingDiv.id = "typing";
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
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

async function sendMessage() {
  const question = messageInput.value.trim();
  if (!question) return;

  const welcome = document.querySelector(".welcome-message");
  if (welcome) welcome.remove();

  addMessage(question, true);
  messageInput.value = "";
  sendBtn.disabled = true;
  showTyping();

  try {
    const manualAnswer = findManualAnswer(question);
    if (manualAnswer) {
      removeTyping();
      addMessage(manualAnswer);
    } else {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const data = await res.json();
      removeTyping();
      addMessage(data.reply || "⚠️ AI service did not return a reply.");
    }
  } catch (err) {
    removeTyping();
    addMessage("⚠️ AI service is currently unavailable. Please try again later.");
    console.error(err);
  }

  sendBtn.disabled = false;
  messageInput.focus();
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

questionChips.forEach(chip => {
  chip.addEventListener("click", () => {
    messageInput.value = chip.dataset.question;
    sendMessage();
  });
});
