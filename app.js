const state = {
  currentView: "dashboard"
};

function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.getElementById("view-" + view).style.display = "block";
}

document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
  });
});

showView("dashboard");