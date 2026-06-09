const LandingPage = (() => {
  function init() {
    bindAuthForm("loginForm", "/auth/login", "Login successful.");
    bindAuthForm("registerForm", "/auth/register", "Registration successful.");
  }

  function bindAuthForm(formId, endpoint, successMessage) {
    const form = document.querySelector(`#${formId}`);
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const username = payload.username?.trim() || "Player";

      try {
        const response = await Api.post(endpoint, payload);
        if (response.token) {
          localStorage.setItem("skillclash_token", response.token);
        }
        Auth.setUser(response.username || username);
        Common.showToast(successMessage);
      } catch {
        Auth.setUser(username);
        Common.showToast("Backend unavailable. Continuing in demo mode.");
      }

      window.setTimeout(() => {
        window.location.href = "pages/home.html";
      }, 450);
    });
  }

  return { init };
})();
