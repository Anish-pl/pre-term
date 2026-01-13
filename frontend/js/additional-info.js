document.getElementById("manualForm").addEventListener("submit", e => {
    e.preventDefault();

    const manualData = Object.fromEntries(new FormData(e.target));
    const ocrData = JSON.parse(localStorage.getItem("ocr_features")) || {};

    const finalPayload = {
        ...ocrData,
        prior_living_children: Number(manualData.prior_living_children),
        prenatal_visits: Number(manualData.prenatal_visits),
        marital_status: Number(manualData.marital_status)
    };

    localStorage.setItem("final_features", JSON.stringify(finalPayload));

    // prediction comes later
    alert("Data saved successfully!");
});
