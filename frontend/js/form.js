(function () {
  const form = document.getElementById('multiForm');
  const steps = Array.from(document.querySelectorAll('.form-step'));
  const progressDots = Array.from(document.querySelectorAll('.progressbar .step'));
  const progressBar = document.getElementById('progressBar');
  const loading = document.getElementById('loading');

  const savedStep = sessionStorage.getItem('currentStep');
  let current = savedStep !== null ? parseInt(savedStep) : 0;

  const savedData = JSON.parse(sessionStorage.getItem('formData') || "{}");

  for (const [name, value] of Object.entries(savedData)) {
    const el = form.elements[name];
    if (el) el.value = value;
  }

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    progressDots.forEach((d, i) => d.classList.toggle('active', i <= index));
    const pct = (index / (steps.length - 1)) * 100;
    if (progressBar) progressBar.style.width = pct + "%";
    current = index;
    sessionStorage.setItem("currentStep", current.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateCurrentStep() {
    const inputs = Array.from(steps[current].querySelectorAll("input, select, textarea"));
    for (const el of inputs) {
      if (!el.hasAttribute("required")) continue;
      if (!el.checkValidity()) {
        el.focus();
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  form.addEventListener("input", function () {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    sessionStorage.setItem("formData", JSON.stringify(data));
  });

  document.addEventListener("click", function (e) {
    const action = e.target.getAttribute("data-action");
    if (!action) return;

    if (action === "next") {
      if (!validateCurrentStep()) return;
      if (current < steps.length - 1) showStep(current + 1);
    } else if (action === "prev") {
      if (current > 0) showStep(current - 1);
    }
  });

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (!validateCurrentStep()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    loading.style.display = "block";

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        // ✅ UPDATED: Save complete analysis data including recommendations
        // Store both in sessionStorage (for backward compatibility) and localStorage (for dashboard)
        sessionStorage.setItem("prediction", JSON.stringify(json));
        localStorage.setItem("analysisResult", JSON.stringify(json));

        // Also save patient form data for reference
        localStorage.setItem("patientData", JSON.stringify(data));

        setTimeout(() => {
          // ✅ UPDATED: Redirect to new dashboard instead of result.html
          window.location.href = "result.html";
        }, 2000);
      } else {
        alert(json.error || "Prediction failed");
        loading.style.display = "none";
      }
    } catch (err) {
      loading.style.display = "none";
      alert("Network error: " + err.message);
    }
  });

  showStep(current);
})();