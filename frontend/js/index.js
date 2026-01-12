

document.addEventListener("DOMContentLoaded", () => {
  const navMenu = document.getElementById("navMenu");
  const startBtn = document.getElementById("startBtn");
  const imageBtn = document.getElementById("imageBtn");

  const user = localStorage.getItem("loggedInUser");

  if (user) {
    // User is logged in
    navMenu.innerHTML = `
      <span>Welcome, ${user}</span>
      <a href="#" id="logoutBtn">Logout</a>
    `;

    startBtn.style.display = "inline-block"; // show button
    imageBtn.style.display = "inline-block";

  } else {
    // User NOT logged in
    navMenu.innerHTML = `
      <a href="login.html">Login</a>
      <a href="signup.html">Sign Up</a>
    `;

    startBtn.style.display = "none"; // hide button
    imageBtn.style.display = "none";
  }

  // Logout logic
  if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.reload();
    });
  }
});