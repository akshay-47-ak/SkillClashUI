const Common = (() => {
  function pagePath(file) {
    return window.location.pathname.includes("/pages/") ? file : `pages/${file}`;
  }

  function renderShell(active = "home") {
    const nav = document.querySelector("[data-app-nav]");
    const footer = document.querySelector("[data-app-footer]");
    const username = getSession("username", "Player");

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
            <div class="sc-navbar-player">
              ${playerMenu(username)}
            </div>
          </div>
        </nav>
      `;
    }

    if (footer) {
      footer.innerHTML = `
        <footer class="border-top border-slate-700/60 py-4 mt-auto">
          <div class="container d-flex flex-column flex-md-row gap-2 justify-content-between text-slate-400 small">
            <span>SkillClash quiz battles with friends</span>
            <span>Create a room. Beat the clock. Claim the crown.</span>
          </div>
        </footer>
      `;
    }

    bindSettings();
    bindPlayerMenu();
    bindLogout();
    bindSocketStatus();
    renderPlayerIdentity(username);

    if (active === "home" && sessionStorage.getItem("skillclash_show_welcome") === "true") {
      sessionStorage.removeItem("skillclash_show_welcome");
      showToast(`Welcome back, ${username}. Ready to battle?`);
    }
  }

  function navLink(key, label, href, active) {
    const activeClass = key === active ? "text-white fw-bold" : "text-slate-300";
    return `<li class="nav-item"><a class="nav-link ${activeClass}" href="${pagePath(href)}">${label}</a></li>`;
  }

  function playerChip(username) {
    const safeName = escapeHtml(username);
    return `
      <span class="sc-player-chip">
        <span class="avatar avatar-sm">${escapeHtml(initials(username))}</span>
        <span class="sc-player-name">${safeName}</span>
      </span>
    `;
  }

  function playerMenu(username) {
    return `
      <div class="sc-player-menu">
        <button class="sc-player-trigger" data-player-menu-toggle type="button" aria-expanded="false" aria-haspopup="menu">
          ${playerChip(username)}
        </button>
        <div class="sc-player-dropdown" data-player-menu hidden>
          <div class="sc-player-dropdown-header">
            <span class="avatar avatar-sm">${escapeHtml(initials(username))}</span>
            <span>${escapeHtml(username)}</span>
          </div>
          <button class="sc-player-dropdown-item" data-logout type="button">Logout</button>
        </div>
      </div>
    `;
  }

  function renderPlayerIdentity(username) {
    document.querySelectorAll("[data-player-name]").forEach((element) => {
      element.textContent = username;
    });
    document.querySelectorAll("[data-player-welcome]").forEach((element) => {
      element.textContent = `Welcome back, ${username}`;
    });
  }

  function bindSettings() {
    document.querySelectorAll("[data-settings-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const apiUrl = window.prompt("Game server URL", Api.getBaseUrl());
        if (apiUrl) Api.setBaseUrl(apiUrl);

        const wsUrl = window.prompt("Live match server URL", SkillClashSocket.getUrl());
        if (wsUrl) SkillClashSocket.setUrl(wsUrl);

        showToast("Settings saved for this browser.");
      });
    });
  }

  function bindPlayerMenu() {
    document.querySelectorAll("[data-player-menu-toggle]").forEach((button) => {
      const menu = button.closest(".sc-player-menu")?.querySelector("[data-player-menu]");
      if (!menu) return;

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = !menu.hidden;
        closePlayerMenus();
        menu.hidden = isOpen;
        button.setAttribute("aria-expanded", String(!isOpen));
      });
    });

    document.addEventListener("click", closePlayerMenus);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePlayerMenus();
    });
  }

  function closePlayerMenus() {
    document.querySelectorAll("[data-player-menu]").forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll("[data-player-menu-toggle]").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
  }

  function bindLogout() {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", async () => {
        const username = getSession("username", "");
        if (!username) {
          finishLogout("You are logged out.");
          return;
        }

        button.disabled = true;
        button.textContent = "Leaving...";

        try {
          const message = await Api.post(`/auth/user/${encodeURIComponent(username)}/logout`);
          finishLogout(message || "User Logout Successfully");
        } catch (error) {
          button.disabled = false;
          button.textContent = "Logout";

          if (error.isNetworkError) {
            showToast(error.message, "error");
            return;
          }

          showToast(error.message || "Logout failed.", "error");
        }
      });
    });
  }

  function finishLogout(message) {
    clearSession();
    sessionStorage.setItem("skillclash_logout_message", String(message));
    window.location.href = landingPath();
  }

  function landingPath() {
    return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
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
        <div class="toast-body">${escapeHtml(message)}</div>
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

  function isLoggedIn() {
    return Boolean(getSession("username", "").trim());
  }

  function requireAuth() {
    if (isLoggedIn()) return true;
    sessionStorage.setItem("skillclash_auth_message", "Please login or register before entering the arena.");
    window.location.href = landingPath();
    return false;
  }

  function clearSession() {
    [
      "skillclash_token",
      "skillclash_username",
      "skillclash_userCode",
      "skillclash_userStatus",
      "skillclash_roomId",
      "skillclash_roomCode",
      "skillclash_roomName",
      "skillclash_category",
      "skillclash_maxPlayers",
      "skillclash_isHost",
      "skillclash_roomSnapshot",
      "skillclash_resultSnapshot"
    ].forEach((key) => localStorage.removeItem(key));
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
    isLoggedIn,
    requireAuth,
    clearSession,
    initials,
    escapeHtml
  };
})();
