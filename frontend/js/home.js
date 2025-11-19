// Check session from backend
fetch("/session")
  .then(res => res.json())
  .then(data => {
    const nav = document.getElementById("navMenu");

    if (data.loggedIn) {
      nav.innerHTML = `
        <span style="margin-right:20px; color:#2b468b;">
          Logged in as <b>${data.email}</b>
        </span>
        <a href="#" id="logoutBtn">Logout</a>
      `;

      // Logout functionality
      document.getElementById("logoutBtn").addEventListener("click", () => {
        fetch("/logout").then(() => {
          window.location.reload();
        });
      });

    } else {
      nav.innerHTML = `
        <a href="login.html">Login</a>
        <a href="signup.html">Sign Up</a>
      `;
    }
  })
  .catch(err => console.log("Session check failed:", err));
