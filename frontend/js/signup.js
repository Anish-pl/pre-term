const backendUrl = "http://localhost:5000";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  try {
    const res = await fetch(`${backendUrl}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    message.textContent = data.message;
    message.style.color = res.ok ? "green" : "red";

    if (res.ok) {
      setTimeout(() => window.location.href = "login.html", 1000);
    }
  } catch (err) {
    message.textContent = "Error connecting to server.";
    message.style.color = "red";
  }
});
