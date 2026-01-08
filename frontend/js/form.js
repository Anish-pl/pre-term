(function () {
  const form = document.getElementById('multiForm');
  const steps = Array.from(document.querySelectorAll('.form-step'));
  const progressDots = Array.from(document.querySelectorAll('.progressbar .step'));
  const progressBar = document.getElementById('progressBar');
  const loading = document.getElementById('loading');

  // GET SAVED STATE
  const savedStep = sessionStorage.getItem('currentStep');
  let current = savedStep !== null ? parseInt(savedStep) : 0;

  const savedData = JSON.parse(sessionStorage.getItem('formData') || "{}");

  // RESTORE FORM VALUES
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

  // SAVE FORM VALUES AS USER TYPES
  form.addEventListener("input", function () {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    sessionStorage.setItem("formData", JSON.stringify(data));
  });

  // NEXT / PREVIOUS
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
        sessionStorage.setItem("prediction", JSON.stringify(json));

        setTimeout(() => {
          window.location.href = "result.html";
        }, 2000); // show loading at least 2s
      } else {
        alert(json.error || "Prediction failed");
        loading.style.display = "none";
      }
    } catch (err) {
      loading.style.display = "none";
      alert("Network error: " + err.message);
    }
  });

  // INITIALIZE
  showStep(current);
})();
//for image processing logic
// const reportInput = document.getElementById("reportUpload");

// if (reportInput) {
//   reportInput.addEventListener("change", async () => {
//     const file = reportInput.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("report", file);

//     const res = await fetch("/api/upload-report", {
//       method: "POST",
//       body: formData
//     });

//     const data = await res.json();
//     const f = data.extracted_features;

//     if (f.hep_b) document.getElementById("hep_b").value = f.hep_b;
//     if (f.syphilis) document.getElementById("syphilis").value = f.syphilis;
//     if (f.hep_c) document.getElementById("hep_c").value = f.hep_c;
//     if (f.gonorrhea) document.getElementById("gonorrhea").value = f.gonorrhea;
//     if (f.chlamydia) document.getElementById("chlamydia").value = f.chlamydia;
//   });
// }
