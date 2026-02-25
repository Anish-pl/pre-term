/* ============================================
   PreTermCare — forgot.js
   ============================================ */

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 24);
});

/* ── Show inline message ── */
function showMessage(text, type) {
  const el = document.getElementById('formMessage');
  el.textContent = text;
  el.className = 'form-message ' + type;
}

/* ── Switch to success state ── */
function showSuccess(email) {
  document.getElementById('stepEmail').style.display   = 'none';
  document.getElementById('stepSuccess').style.display = 'block';
  document.getElementById('signupHint').style.display  = 'none';
  document.getElementById('sentEmail').textContent      = email;
}

/* ── Forgot password form ── */
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const btn   = document.getElementById('submitBtn');

  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch('http://localhost:5000/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      showSuccess(email);
    } else {
      showMessage(data.message || 'Could not send reset link. Please try again.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Send Reset Link →';
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    /* On network failure, show success anyway to prevent email enumeration */
    showSuccess(email);
  }
});

/* ── Resend button ── */
const resendBtn = document.getElementById('resendBtn');
resendBtn && resendBtn.addEventListener('click', async () => {
  const email = document.getElementById('sentEmail').textContent;
  resendBtn.textContent = 'Sending…';
  resendBtn.disabled    = true;

  try {
    await fetch('http://localhost:5000/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch (_) {}

  resendBtn.textContent = 'Sent ✓';
  setTimeout(() => {
    resendBtn.textContent = 'resend the email';
    resendBtn.disabled    = false;
  }, 4000);
});