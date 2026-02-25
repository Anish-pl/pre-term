/* ============================================
   PreTermCare — form.js
   All original functionality preserved
   ============================================ */

(function () {
  /* ── Core references ── */
  const form         = document.getElementById('multiForm');
  const steps        = Array.from(document.querySelectorAll('.form-step'));
  const progressFill = document.getElementById('progressBar');
  const progressLbl  = document.getElementById('progressLabel');
  const loading      = document.getElementById('loading');
  const navbar       = document.getElementById('navbar');

  /* Sidebar step indicators */
  const sideSteps = [
    document.getElementById('sideStep0'),
    document.getElementById('sideStep1'),
    document.getElementById('sideStep2'),
  ];

  /* ── Restore session ── */
  const savedStep = sessionStorage.getItem('currentStep');
  let current = savedStep !== null ? parseInt(savedStep) : 0;

  const savedData = JSON.parse(sessionStorage.getItem('formData') || '{}');
  for (const [name, value] of Object.entries(savedData)) {
    const el = form.elements[name];
    if (el) el.value = value;
  }

  /* ── Navbar scroll ── */
  window.addEventListener('scroll', () => {
    navbar && navbar.classList.toggle('scrolled', window.scrollY > 24);
  });

  /* ── Animated dots on loading text ── */
  let dotsInterval;
  function startDots() {
    const el = document.getElementById('dots');
    if (!el) return;
    const seq = ['…', '.. ', '.  '];
    let i = 0;
    dotsInterval = setInterval(() => { el.textContent = seq[i++ % seq.length]; }, 420);
  }
  function stopDots() { clearInterval(dotsInterval); }

  /* ── Show/hide loading overlay ── */
  function showLoading() {
    loading.classList.add('visible');
    startDots();
  }
  function hideLoading() {
    loading.classList.remove('visible');
    stopDots();
  }

  /* ── Update progress bar & sidebar ── */
  function updateProgress(index) {
    const pct = (index / (steps.length - 1)) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLbl)  progressLbl.textContent  = `Step ${index + 1} of ${steps.length}`;

    sideSteps.forEach((el, i) => {
      if (!el) return;
      el.classList.remove('active', 'done');
      if (i < index)  el.classList.add('done');
      if (i === index) el.classList.add('active');
    });
  }

  /* ── Show a specific step ── */
  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    updateProgress(index);
    current = index;
    sessionStorage.setItem('currentStep', current.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Validate current step's required fields ── */
  function validateCurrentStep() {
    const inputs = Array.from(
      steps[current].querySelectorAll('input, select, textarea')
    );
    for (const el of inputs) {
      if (!el.hasAttribute('required')) continue;
      if (!el.checkValidity()) {
        el.focus();
        el.reportValidity();
        /* Flash error border */
        el.style.borderColor = '#ef4444';
        el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
        setTimeout(() => {
          el.style.borderColor = '';
          el.style.boxShadow   = '';
        }, 2000);
        return false;
      }
    }
    return true;
  }

  /* ── Persist form data on every change ── */
  form.addEventListener('input', function () {
    const data = Object.fromEntries(new FormData(form).entries());
    sessionStorage.setItem('formData', JSON.stringify(data));
  });

  /* ── Next / Previous button clicks ── */
  document.addEventListener('click', function (e) {
    const action = e.target.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;

    if (action === 'next') {
      if (!validateCurrentStep()) return;
      if (current < steps.length - 1) showStep(current + 1);
    } else if (action === 'prev') {
      if (current > 0) showStep(current - 1);
    }
  });

  /* ── Form submit ── */
  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (!validateCurrentStep()) return;

    const data = Object.fromEntries(new FormData(form).entries());

    showLoading();

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        /* ✅ Save results for result.html / dashboard */
        sessionStorage.setItem('prediction',    JSON.stringify(json));
        localStorage.setItem('analysisResult',  JSON.stringify(json));
        localStorage.setItem('patientData',     JSON.stringify(data));

        setTimeout(() => {
          window.location.href = 'result.html';
        }, 2000);
      } else {
        hideLoading();
        alert(json.error || 'Prediction failed. Please try again.');
      }
    } catch (err) {
      hideLoading();
      alert('Network error: ' + err.message);
    }
  });

  /* ── Initialise ── */
  showStep(current);
})();