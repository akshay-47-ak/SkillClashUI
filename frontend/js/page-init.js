document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  const initializers = {
    landing: () => LandingPage.init(),
    home: () => Common.renderShell("home"),
    "create-room": () => RoomPage.initCreateRoom(),
    "join-room": () => RoomPage.initJoinRoom(),
    lobby: () => LobbyPage.init(),
    quiz: () => QuizPage.init(),
    result: () => ResultPage.init()
  };

  initializers[page]?.();
});
