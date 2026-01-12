const ocrData = JSON.parse(localStorage.getItem("ocr_features")) || {};
const container = document.getElementById("ocrFeatures");

for (const key in ocrData) {
    const div = document.createElement("div");

    div.innerHTML = `
    <label>${key.replace("_", " ").toUpperCase()}</label>
    <input value="${formatValue(ocrData[key])}" readonly>
  `;

    container.appendChild(div);
}

document.getElementById("manualForm").addEventListener("submit", async e => {
    e.preventDefault();

    const manual = Object.fromEntries(new FormData(e.target));

    const finalFeatures = {
        ...ocrData,
        ...convertManual(manual)
    };

    const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFeatures)
    });

    const result = await res.json();
    alert("Preterm Risk: " + result.risk);
});

function formatValue(v) {
    if (v === 1) return "Yes";
    if (v === 0) return "No";
    if (v === -1) return "Unknown";
    if (v == null) return "Not detected";
    return v;
}

function convertManual(data) {
    return {
        prior_living_children: Number(data.prior_living_children),
        prenatal_visits: Number(data.prenatal_visits),
        marital_status: Number(data.marital_status)
    };
}
