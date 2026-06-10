const Auth = (() => {
  function currentUser() {
    return Common.getSession("username", "Player");
  }

  function setUser(username) {
    Common.saveSession({ username: username || "Player" });
  }

  function setRegisteredUser(user) {
    Common.saveSession({
      username: user.username || "Player",
      userCode: user.userCode || "",
      userStatus: user.status || ""
    });
  }

  function clearSession() {
    Common.clearSession();
  }

  return { currentUser, setUser, setRegisteredUser, clearSession };
})();
