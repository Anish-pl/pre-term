const backendUrl = "http://localhost:5000";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  try {
    const res = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    message.textContent = data.message;
    message.style.color = res.ok ? "green" : "red";

    if (res.ok) {
      setTimeout(() => window.location.href = "index.html", 1000);
    }
  } catch (err) {
    message.textContent = "Error connecting to server.";
    message.style.color = "red";
  }
});
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    });

    // Password toggle
    const togglePwd = document.getElementById('togglePwd');
    const passwordInput = document.getElementById('password');
    togglePwd.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      togglePwd.textContent = isHidden ? '🙈' : '👁';
    });

    // Show message helper
    function showMessage(text, type) {
      const el = document.getElementById('formMessage');
      el.textContent = text;
      el.className = 'form-message ' + type;
    }

    // Login form submit
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = document.getElementById('submitBtn');

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        const res = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          showMessage(data.message || 'Login successful!', 'success');
          localStorage.setItem('loggedInUser', email);
          setTimeout(() => { window.location.href = 'index.html'; }, 800);
        } else {
          showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
          btn.disabled = false;
          btn.textContent = 'Sign In →';
        }
      } catch (err) {
        console.error('Login error:', err);
        showMessage('Unable to connect. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In →';
      }
    });
