const Common = (() => {
  function pagePath(file) {
    return window.location.pathname.includes("/pages/") ? file : `pages/${file}`;
  }

  function renderShell(active = "home") {
    const nav = document.querySelector("[data-app-nav]");
    const footer = document.querySelector("[data-app-footer]");

    if (nav) {
      nav.innerHTML = `
        <nav class="navbar navbar-expand-lg fixed-top sc-navbar" aria-label="Main navigation">
          <div class="container">
            <a class="navbar-brand sc-brand text-white" href="${pagePath("home.html")}">
              <span class="sc-logo">SC</span>
              <span>SkillClash</span>
            </a>
            <button class="navbar-toggler bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#skillNav" aria-controls="skillNav" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="skillNav">
              <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
                ${navLink("home", "Home", "home.html", active)}
                ${navLink("create", "Create", "create-room.html", active)}
                ${navLink("join", "Join", "join-room.html", active)}
                ${navLink("result", "Results", "result.html", active)}
                <li class="nav-item"><button class="btn sc-btn-ghost btn-sm ms-lg-2" data-settings-open type="button">Settings</button></li>
              </ul>
            </div>
          </div>
        </nav>
      `;
    }

    if (footer) {
      footer.innerHTML = `
        <footer class="border-top border-slate-700/60 py-4 mt-auto">
          <div class="container d-flex flex-column flex-md-row gap-2 justify-content-between text-slate-400 small">
            <span>SkillClash real-time quiz battles</span>
            <span>Spring Boot REST + native STOMP WebSocket ready</span>
          </div>
        </footer>
      `;
    }

    bindSettings();
    bindSocketStatus();
  }

  function navLink(key, label, href, active) {
    const activeClass = key === active ? "text-white fw-bold" : "text-slate-300";
    return `<li class="nav-item"><a class="nav-link ${activeClass}" href="${pagePath(href)}">${label}</a></li>`;
  }

  function bindSettings() {
    document.querySelectorAll("[data-settings-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const apiUrl = window.prompt("Backend API base URL", Api.getBaseUrl());
        if (apiUrl) Api.setBaseUrl(apiUrl);

        const wsUrl = window.prompt("WebSocket URL", SkillClashSocket.getUrl());
        if (wsUrl) SkillClashSocket.setUrl(wsUrl);

        showToast("Settings saved for this browser.");
      });
    });
  }

  function bindSocketStatus() {
    const indicator = document.querySelector("[data-socket-status]");
    if (!indicator) return;

    window.addEventListener("skillclash:socket-status", (event) => {
      indicator.textContent = event.detail.status;
      indicator.dataset.status = event.detail.status;
    });
  }

  function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container position-fixed bottom-0 end-0 p-3";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-bg-dark border-0";
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    container.appendChild(toast);
    bootstrap.Toast.getOrCreateInstance(toast, { delay: type === "error" ? 5200 : 3200 }).show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  }

  function getParam(name, fallback = "") {
    return new URLSearchParams(window.location.search).get(name) || fallback;
  }

  function saveSession(data) {
    Object.entries(data).forEach(([key, value]) => localStorage.setItem(`skillclash_${key}`, value));
  }

  function getSession(key, fallback = "") {
    return localStorage.getItem(`skillclash_${key}`) || fallback;
  }

  function initials(name = "P") {
    return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  return {
    renderShell,
    showToast,
    getParam,
    saveSession,
    getSession,
    initials,
    escapeHtml
  };
})();
