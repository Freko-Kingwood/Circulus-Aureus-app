const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginView = document.getElementById("view-login");
const app = document.getElementById("app");

const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");

// LOGIN CLICK
loginBtn.onclick = () => {
  netlifyIdentity.open();
};

// LOGOUT
logoutBtn.onclick = () => {
  netlifyIdentity.logout();
};

// LOGIN EVENT
netlifyIdentity.on("login", user => {
  loginView.classList.add("hidden");
  app.classList.remove("hidden");

  userName.innerText = user.user_metadata.full_name || "Medlem";
  userEmail.innerText = user.email;

  netlifyIdentity.close();
});

// LOGOUT EVENT
netlifyIdentity.on("logout", () => {
  app.classList.add("hidden");
  loginView.classList.remove("hidden");
});

// AUTO LOGIN CHECK
netlifyIdentity.on("init", user => {
  if (user) {
    loginView.classList.add("hidden");
    app.classList.remove("hidden");

    userName.innerText = user.user_metadata.full_name || "Medlem";
    userEmail.innerText = user.email;
  }
});

// NAVIGATION
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    const view = document.getElementById("view-" + btn.dataset.view);
    if(view) view.classList.add("active");
  };
});