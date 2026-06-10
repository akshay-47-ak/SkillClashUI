document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const publicPages = ["landing"];

  const initializers = {
    landing: () => LandingPage.init(),
    home: () => Common.renderShell("home"),
    "create-room": () => RoomPage.initCreateRoom(),
    "join-room": () => RoomPage.initJoinRoom(),
    lobby: () => LobbyPage.init(),
    quiz: () => QuizPage.init(),
    result: () => ResultPage.init()
  };

  if (!publicPages.includes(page) && !Common.requireAuth()) return;

  initializers[page]?.();
});
