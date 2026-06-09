const Auth = (() => {
  function currentUser() {
    return Common.getSession("username", "Player");
  }

  function setUser(username) {
    Common.saveSession({ username: username || "Player" });
  }

  return { currentUser, setUser };
})();
