
    (function () {
      const form = document.getElementById('multiForm');
      const steps = Array.from(document.querySelectorAll('.form-step'));
      const progressDots = Array.from(document.querySelectorAll('.progressbar .step'));
      const progressBar = document.getElementById('progressBar');
      const loading = document.getElementById('loading');
      const resultBox = document.getElementById('result');

      let current = 0;

      // Helpers
      function showStep(index) {
        steps.forEach((s, i) => s.classList.toggle('active', i === index));
        progressDots.forEach((d, i) => d.classList.toggle('active', i <= index));
        const pct = (index / (steps.length - 1)) * 100;
        progressBar.style.width = pct + '%';
        current = index;
        // scroll top of container for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Validate current step inputs using HTML5 validation
      function validateCurrentStep() {
        const inputs = Array.from(steps[current].querySelectorAll('input, select, textarea'));
        for (const el of inputs) {
          // skip validation for optional fields (no required attribute)
          if (!el.hasAttribute('required')) continue;
          if (!el.checkValidity()) {
            el.focus();
            // show default browser message
            el.reportValidity();
            return false;
          }
        }
        return true;
      }

      // Click handlers (delegation)
      document.addEventListener('click', function (e) {
        const action = e.target.getAttribute('data-action');
        if (!action) return;

        if (action === 'next') {
          // validate before moving forward
          if (!validateCurrentStep()) return;
          if (current < steps.length - 1) showStep(current + 1);
        } else if (action === 'prev') {
          if (current > 0) showStep(current - 1);
        }
      });

      // Form submit
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        // final validation
        if (!validateCurrentStep()) return;

        // collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // show loading
        loading.style.display = 'block';
        resultBox.style.display = 'none';
        resultBox.innerHTML = '';

        try {
          // change to your endpoint if needed
          const res = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const json = await res.json().catch(()=>({ error: 'invalid json response' }));
          loading.style.display = 'none';
          resultBox.style.display = 'block';
          resultBox.style.background = '#e9f7ef';
          resultBox.style.padding = '12px';
          resultBox.style.borderRadius = '8px';
          if (res.ok) {
            resultBox.innerHTML = '<strong>Prediction result:</strong><pre style="white-space:pre-wrap;">' + (JSON.stringify(json, null, 2)) + '</pre>';
          } else {
            resultBox.innerHTML = '<strong>Error from server:</strong> ' + (json.error || res.statusText);
            resultBox.style.background = '#ffe6e6';
          }
        } catch (err) {
          loading.style.display = 'none';
          resultBox.style.display = 'block';
          resultBox.style.background = '#ffe6e6';
          resultBox.innerHTML = '<strong>Network error:</strong> ' + err.message;
        }
      });

      // initialize
      showStep(0);
      // focus first required input
      const firstReq = steps[0].querySelector('[required]');
      if (firstReq) firstReq.focus();
    })();
  
