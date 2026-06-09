const LandingPage = (() => {
  function init() {
    bindLoginForm();
    bindRegisterForm();
  }

  function bindLoginForm() {
    const form = document.querySelector("#loginForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const username = payload.username?.trim() || "Player";

      try {
        const response = await Api.post("/auth/login", payload);
        if (response.token) {
          localStorage.setItem("skillclash_token", response.token);
        }
        Auth.setUser(response.username || username);
        Common.showToast("Login successful.");
        redirectToApp();
      } catch (error) {
        if (error.isNetworkError) {
          Common.showToast(error.message, "error");
          return;
        }

        Common.showToast(error.message || "Login failed.", "error");
      }
    });
  }

  function bindRegisterForm() {
    const form = document.querySelector("#registerForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('[type="submit"]');
      const payload = getRegistrationPayload(form);

      setSubmitting(submitButton, true, "Creating...");

      try {
        const registeredUser = await Api.post("/auth/user/register", payload);
        Auth.setRegisteredUser(registeredUser);
        Common.showToast(`Welcome ${registeredUser.username}. Your code is ${registeredUser.userCode}.`);
        redirectToApp();
      } catch (error) {
        if (error.isNetworkError) {
          Common.showToast(error.message, "error");
          return;
        }

        Common.showToast(error.message || "Registration failed.", "error");
      } finally {
        setSubmitting(submitButton, false, "Register");
      }
    });
  }

  function getRegistrationPayload(form) {
    const formData = new FormData(form);

    return {
      username: String(formData.get("username") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "")
    };
  }

  function setSubmitting(button, isSubmitting, label) {
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = label;
  }

  function redirectToApp() {
    window.setTimeout(() => {
      window.location.href = "pages/home.html";
    }, 450);
  }

  return { init };
})();
