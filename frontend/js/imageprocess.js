document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("imageForm");
  const fileInput = document.getElementById("imageInput");
  const rawTextOutput = document.getElementById("rawTextOutput");
  const featuresTableBody = document
    .getElementById("featuresOutput")
    .querySelector("tbody");
  const loader = document.getElementById("loader");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) return alert("Please upload an image");

    const formData = new FormData();
    formData.append("report", file);

    // Show loader
    loader.style.display = "block";
    rawTextOutput.textContent = "";
    featuresTableBody.innerHTML = "";

    try {
      const res = await fetch("/api/upload-report", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Clean raw OCR text before displaying
      const cleanedText = cleanOCRText(data.raw_text);
      rawTextOutput.textContent = cleanedText;

      // Show extracted features nicely
      const features = data.extracted_features;
      for (const key in features) {
        const row = document.createElement("tr");

        const featureCell = document.createElement("td");
        featureCell.textContent = key.replace("_", " ").toUpperCase();

        const valueCell = document.createElement("td");
        valueCell.textContent = features[key] || "Not detected";

        row.appendChild(featureCell);
        row.appendChild(valueCell);
        featuresTableBody.appendChild(row);
      }

    } catch (err) {
      console.error(err);
      alert("OCR failed. Check console.");
    } finally {
      // Hide loader
      loader.style.display = "none";
    }
  });
});

// 🔧 Simple OCR cleanup function
function cleanOCRText(text) {
  return text
    .replace(/\n{2,}/g, "\n")     // remove extra blank lines
    .replace(/[^\x00-\x7F]/g, "") // remove weird symbols
    .trim();
}
