document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("imageForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("imageInput").files[0];
    if (!file) return alert("Upload image");

    const fd = new FormData();
    fd.append("report", file);

    const res = await fetch("/api/upload-report", {
      method: "POST",
      body: fd
    });

    const data = await res.json();

    localStorage.setItem(
      "ocr_features",
      JSON.stringify(data.extracted_features)
    );

    window.location.href = "form-ocr-review.html";
  });
});
