/* ============================================
   PreTermCare — signup.js
   ============================================ */

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 24);
});

/* ── Password toggle helpers ── */
function bindPasswordToggle(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type   = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '👁' : '👁';
  });
}
bindPasswordToggle('togglePwd',     'password');
bindPasswordToggle('toggleConfirm', 'confirmPassword');

/* ── Password strength meter ── */
const passwordInput  = document.getElementById('password');
const strengthBar    = document.getElementById('strengthBar');
const strengthFill   = document.getElementById('strengthFill');
const strengthLabel  = document.getElementById('strengthLabel');

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const levels = [
  { label: '',        color: 'transparent', width: '0%'   },
  { label: 'Weak',    color: '#ef4444',     width: '25%'  },
  { label: 'Fair',    color: '#f59e0b',     width: '50%'  },
  { label: 'Good',    color: '#3b82f6',     width: '75%'  },
  { label: 'Strong',  color: '#10b981',     width: '90%'  },
  { label: 'Great!',  color: '#00897b',     width: '100%' },
];

passwordInput && passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  if (!val) {
    strengthBar.classList.remove('visible');
    return;
  }
  strengthBar.classList.add('visible');
  const score = Math.min(getStrength(val), 5);
  const lvl   = levels[score];
  strengthFill.style.width      = lvl.width;
  strengthFill.style.background = lvl.color;
  strengthLabel.textContent     = lvl.label;
  strengthLabel.style.color     = lvl.color;
});

/* ── Show message ── */
function showMessage(text, type) {
  const el = document.getElementById('formMessage');
  el.textContent = text;
  el.className = 'form-message ' + type;
}

/* ── Signup form submit ── */
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirmPassword').value;
  const btn      = document.getElementById('submitBtn');

  /* Client-side validation */
  if (password !== confirm) {
    showMessage('Passwords do not match. Please try again.', 'error');
    document.getElementById('confirmPassword').classList.add('input-error');
    return;
  }
  document.getElementById('confirmPassword').classList.remove('input-error');

  if (password.length < 8) {
    showMessage('Password must be at least 8 characters.', 'error');
    return;
  }

  btn.disabled     = true;
  btn.textContent  = 'Creating account…';

  try {
    const res = await fetch('http://localhost:5000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.message || 'Account created! Redirecting to login…', 'success');
      btn.textContent = 'Account Created ✓';
      setTimeout(() => { window.location.href = 'login.html'; }, 1400);
    } else {
      showMessage(data.message || 'Sign up failed. Please try again.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Create Account →';
    }
  } catch (err) {
    console.error('Signup error:', err);
    showMessage('Unable to connect. Please check your connection and try again.', 'error');
    btn.disabled    = false;
    btn.textContent = 'Create Account →';
  }
});