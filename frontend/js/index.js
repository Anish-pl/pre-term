

document.addEventListener("DOMContentLoaded", () => {
  const navMenu = document.getElementById("navMenu");
  const startBtn = document.getElementById("startBtn");
  const imageBtn = document.getElementById("imageBtn");
  const chatBtn = document.getElementById("chatBtn");

  const user = localStorage.getItem("loggedInUser");

  if (user) {
    navMenu.innerHTML = `
      <span>Welcome, ${user}</span>
      <a href="#" id="logoutBtn">Logout</a>
    `;

    startBtn.style.display = "inline-block"; 
    imageBtn.style.display = "inline-block";
   

    loginBtn.style.display = "none";


  } else {

    navMenu.innerHTML = `
      <a href="login.html">Login</a>
      <a href="signup.html">Sign Up</a>
    `;

    startBtn.style.display = "none"; 
    imageBtn.style.display = "none";
    loginBtn.style.display = "inline-block";
  }

  if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.reload();
    });
  }
});