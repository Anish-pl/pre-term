document.addEventListener("DOMContentLoaded", () => {
  const data = sessionStorage.getItem("extractedFeatures");

  if (!data) return;

  const features = JSON.parse(data);

  Object.entries(features).forEach(([key, value]) => {
    const field = document.getElementById(key);
    if (!field) return;

    field.value = value === null ? "" : value;
  });
});
