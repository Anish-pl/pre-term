    /* ──────────────────────────────────────
       NAVBAR SCROLL EFFECT
    ────────────────────────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    });

    /* Smooth scroll for anchor links */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* ──────────────────────────────────────
       AUTH STATE  (ported from old index.js)
    ────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
      const navMenu  = document.getElementById('navMenu');
      const startBtn = document.getElementById('startBtn');
      const imageBtn = document.getElementById('imageBtn');
      const loginBtn = document.getElementById('loginBtn');

      const user = localStorage.getItem('loggedInUser');

      if (user) {
        /* ── Logged-in nav ── */
        navMenu.innerHTML = `
          <a href="index.html" class="nav-link active">Home</a>
          <a href="#how-it-works" class="nav-link">How It Works</a>
          <a href="#about" class="nav-link">About</a>
          <span class="nav-divider"></span>
          <span class="nav-user-greeting">👋 ${user}</span>
          <a href="#" class="nav-btn nav-btn--logout" id="logoutBtn">Logout</a>
        `;

        startBtn.style.display = 'inline-flex';
        imageBtn.style.display  = 'inline-flex';
        loginBtn.style.display  = 'none';
        createfreeacc.style.display  = 'none';
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('loggedInUser');
          window.location.reload();
        });

      } else {
        /* ── Logged-out nav ── */
        navMenu.innerHTML = `
          <a href="index.html" class="nav-link active">Home</a>
          <a href="#how-it-works" class="nav-link">How It Works</a>
          <a href="#about" class="nav-link">About</a>
          <span class="nav-divider"></span>
          <a href="login.html"  class="nav-btn nav-btn--ghost">Login</a>
          <a href="signup.html" class="nav-btn nav-btn--solid">Sign Up</a>
        `;

        startBtn.style.display = 'none';
        imageBtn.style.display  = 'none';
        loginBtn.style.display  = 'inline-flex';
      }

      /* Re-bind smooth scroll for dynamically added anchor links */
      document.querySelectorAll('#navMenu a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const target = document.querySelector(a.getAttribute('href'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    });

    /* ──────────────────────────────────────
       CHATBOT WIDGET
    ────────────────────────────────────── */
    const chatbotToggle  = document.getElementById('chatbotToggle');
    const chatbotWidget  = document.getElementById('chatbotWidget');
    const chatbotClose   = document.getElementById('chatbotClose');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput   = document.getElementById('chatbotInput');
    const chatbotSend    = document.getElementById('chatbotSend');
    const chatBadge      = document.getElementById('chatBadge');
    const quickReplies   = document.getElementById('quickReplies');

    /* Toggle open/close */
    function openChat() {
      chatbotWidget.classList.add('open');
      chatBadge.style.display = 'none';
      chatbotInput.focus();
    }
    function closeChat() {
      chatbotWidget.classList.remove('open');
    }

    chatbotToggle.addEventListener('click', () => {
      chatbotWidget.classList.contains('open') ? closeChat() : openChat();
    });
    chatbotClose.addEventListener('click', closeChat);

    /* Scroll messages to bottom */
    function scrollToBottom() {
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    /* Append a message bubble */
    function appendMessage(text, role) {
      const wrap = document.createElement('div');
      wrap.className = `chat-message chat-message--${role}`;

      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = text;

      wrap.appendChild(bubble);
      chatbotMessages.appendChild(wrap);
      scrollToBottom();
    }

    /* Typing indicator */
    function showTyping() {
      const wrap = document.createElement('div');
      wrap.className = 'chat-message chat-message--bot';
      wrap.id = 'typingIndicator';
      wrap.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>`;
      chatbotMessages.appendChild(wrap);
      scrollToBottom();
    }
    function removeTyping() {
      const el = document.getElementById('typingIndicator');
      if (el) el.remove();
    }

    /* Simple local knowledge base for offline fallback */
    const localAnswers = {
      "what is preterm birth": "Preterm birth is when a baby is born before 37 weeks of pregnancy. It's the leading cause of newborn complications worldwide and affects about 1 in 10 pregnancies.",
      "risk factors": "Key risk factors include previous preterm births, multiple pregnancies (twins/triplets), infections, cervical or uterine abnormalities, smoking, stress, and poor prenatal care.",
      "prevent preterm birth": "Prevention includes regular prenatal check-ups, avoiding smoking and alcohol, managing chronic conditions, maintaining a healthy weight, and using progesterone supplements if prescribed by your doctor.",
      "warning signs": "Warning signs include regular contractions before 37 weeks, lower back pain, pelvic pressure, vaginal discharge changes, or abdominal cramping. Seek medical attention immediately if you experience these.",
    };

    function getLocalAnswer(message) {
      const lower = message.toLowerCase();
      for (const [key, val] of Object.entries(localAnswers)) {
        if (lower.includes(key.split(' ')[0]) && lower.includes(key.split(' ')[key.split(' ').length - 1])) {
          return val;
        }
      }
      return null;
    }

    /* Send message handler */
    async function sendMessage(text) {
      const msg = (text || chatbotInput.value).trim();
      if (!msg) return;

      chatbotInput.value = '';
      quickReplies.style.display = 'none'; // hide quick replies after first message
      appendMessage(msg, 'user');
      showTyping();

      /* Try backend, fall back to local answers */
      try {
        const res = await fetch('http://localhost:5000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });

        removeTyping();

        if (res.ok) {
          const data = await res.json();
          appendMessage(data.reply || data.message || 'I received your message!', 'bot');
        } else {
          throw new Error('Non-OK response');
        }
      } catch {
        removeTyping();
        const local = getLocalAnswer(msg);
        appendMessage(
          local || "I'm not sure about that. Please consult a qualified healthcare professional or try rephrasing your question.",
          'bot'
        );
      }
    }

    chatbotSend.addEventListener('click', () => sendMessage());
    chatbotInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    /* Quick reply buttons */
    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.message));
    });