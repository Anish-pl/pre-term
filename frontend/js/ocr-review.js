const ocrData = JSON.parse(localStorage.getItem("ocr_features")) || {};
const container = document.getElementById("ocrFeatures");

for (const key in ocrData) {
    const div = document.createElement("div");
    div.className = "field";

    div.innerHTML = `
    <label>${key.replace(/_/g, " ").toUpperCase()}</label>
    <input type="text" value="${formatValue(ocrData[key])}" readonly />
  `;

    container.appendChild(div);
}

document.getElementById("nextBtn").addEventListener("click", () => {
    window.location.href = "additional-info.html";
});

function formatValue(v) {
    if (v === 1) return "Yes";
    if (v === 0) return "No";
    if (v === -1) return "Unknown";
    if (v == null) return "Not detected";
    return v;
}
