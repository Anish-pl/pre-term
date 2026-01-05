(function () {
  const form = document.getElementById('multiForm');
  const steps = Array.from(document.querySelectorAll('.form-step'));
  const progressDots = Array.from(document.querySelectorAll('.progressbar .step'));
  const progressBar = document.getElementById('progressBar');
  const loading = document.getElementById('loading');

  // Restore saved step and form data from sessionStorage
  let current = Number(sessionStorage.getItem('currentStep') || 0);
  const savedData = JSON.parse(sessionStorage.getItem('formData') || '{}');

  // Restore form values
  for (const [name, value] of Object.entries(savedData)) {
    const el = form.elements[name];
    if (el) el.value = value;
  }

  // Show a specific step
  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    progressDots.forEach((d, i) => d.classList.toggle('active', i <= index));
    const pct = (index / (steps.length - 1)) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    current = index;
    sessionStorage.setItem('currentStep', current); // save current step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Validate current step
  function validateCurrentStep() {
    const inputs = Array.from(steps[current].querySelectorAll('input, select, textarea'));
    for (const el of inputs) {
      if (!el.hasAttribute('required')) continue;
      if (!el.checkValidity()) {
        el.focus();
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  // Save form data on every input change
  form.addEventListener('input', function () {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    sessionStorage.setItem('formData', JSON.stringify(data));
  });

  // Next / Previous buttons
  document.addEventListener('click', function (e) {
    const action = e.target.getAttribute('data-action');
    if (!action) return;

    if (action === 'next') {
      if (!validateCurrentStep()) return;
      if (current < steps.length - 1) showStep(current + 1);
    } else if (action === 'prev') {
      if (current > 0) showStep(current - 1);
    }
  });

  // Form submit
  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (!validateCurrentStep()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    loading.style.display = 'block';

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();

      loading.style.display = 'none';

      if (res.ok) {
  sessionStorage.setItem('prediction', JSON.stringify(json));

  // Animate dots
  const dots = document.getElementById('dots');
  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    dots.textContent = '.'.repeat(dotCount);
  }, 500);

  // Keep loading for 3.5 seconds
  setTimeout(() => {
    clearInterval(dotInterval); // stop dots animation
    sessionStorage.removeItem('formData'); // clear saved form
    sessionStorage.removeItem('currentStep'); // clear saved step
    window.location.href = 'result.html';
  }, 3500); // 3.5 seconds


      } else {
        alert(json.error || 'Prediction failed');
      }
    } catch (err) {
      loading.style.display = 'none';
      alert('Network error: ' + err.message);
    }
  });

  // Initialize page with restored step
  showStep(current);
  const firstReq = steps[current].querySelector('[required]');
  if (firstReq) firstReq.focus();
})();
