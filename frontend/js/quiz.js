const QuizPage = (() => {
  const demoQuestions = [
    {
      id: 1,
      text: "Which Spring annotation creates a REST controller?",
      options: ["@Service", "@Repository", "@RestController", "@Component"],
      answer: 2
    },
    {
      id: 2,
      text: "Which protocol pattern does STOMP use over WebSocket?",
      options: ["Frames", "SQL rows", "HTML forms", "Binary only"],
      answer: 0
    },
    {
      id: 3,
      text: "Which HTTP method is commonly used to create a room?",
      options: ["GET", "POST", "TRACE", "OPTIONS"],
      answer: 1
    }
  ];

  let roomCode = "";
  let questions = demoQuestions;
  let currentIndex = 0;
  let selectedIndex = null;
  let score = 0;
  let remaining = 20;
  let timer = null;

  async function init() {
    Common.renderShell("quiz");
    roomCode = Common.getParam("roomCode", Common.getSession("roomCode", "DEMO01"));
    await loadQuestions();
    bindEvents();
    connectRealtime();
    renderQuestion();
  }

  async function loadQuestions() {
    try {
      const payload = await Api.get(`/rooms/${roomCode}/questions`);
      questions = payload.questions || payload;
    } catch {
      questions = demoQuestions;
    }
  }

  function bindEvents() {
    document.querySelector("#submitAnswerBtn")?.addEventListener("click", submitAnswer);
  }

  function renderQuestion() {
    window.clearInterval(timer);
    selectedIndex = null;
    remaining = 20;
    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    document.querySelector("#questionCounter").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    document.querySelector("#questionText").textContent = question.text;
    document.querySelector("#quizProgress").style.width = `${progress}%`;
    document.querySelector("#scoreValue").textContent = score;
    document.querySelector("#optionsList").innerHTML = question.options.map((option, index) => `
      <button class="answer-option focus-ring" type="button" data-option-index="${index}" aria-pressed="false">
        <span class="fw-bold me-2">${String.fromCharCode(65 + index)}.</span>${Common.escapeHtml(option)}
      </button>
    `).join("");

    document.querySelectorAll("[data-option-index]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedIndex = Number(button.dataset.optionIndex);
        document.querySelectorAll("[data-option-index]").forEach((item) => item.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");
      });
    });

    tick();
    timer = window.setInterval(tick, 1000);
  }

  function tick() {
    document.querySelector("#timerValue").textContent = remaining;
    document.querySelector(".timer-ring").style.setProperty("--timer-progress", `${(remaining / 20) * 100}%`);

    if (remaining <= 0) {
      submitAnswer();
      return;
    }

    remaining -= 1;
  }

  async function submitAnswer() {
    window.clearInterval(timer);
    const question = questions[currentIndex];
    const correct = selectedIndex === question.answer;
    if (correct) score += Math.max(100 + remaining * 5, 100);

    try {
      await Api.post(`/rooms/${roomCode}/answers`, {
        questionId: question.id,
        selectedIndex,
        username: Auth.currentUser(),
        remainingSeconds: remaining
      });
      await SkillClashSocket.publish(`/app/rooms/${roomCode}/answers`, { username: Auth.currentUser(), score });
    } catch {
      Common.showToast(correct ? "Correct answer." : "Answer submitted.");
    }

    currentIndex += 1;
    if (currentIndex >= questions.length) {
      persistResult();
      window.location.href = `result.html?roomCode=${encodeURIComponent(roomCode)}`;
      return;
    }

    renderQuestion();
  }

  async function connectRealtime() {
    try {
      await SkillClashSocket.subscribe(`/topic/rooms/${roomCode}/scores`, (payload) => {
        renderLiveScores(payload.scores || payload);
      });
    } catch {
      renderLiveScores([{ username: Auth.currentUser(), score }]);
    }
  }

  function renderLiveScores(scores) {
    document.querySelector("#liveScores").innerHTML = scores.map((player) => `
      <div class="d-flex justify-content-between border-bottom border-slate-700 py-2">
        <span>${Common.escapeHtml(player.username)}</span>
        <strong>${player.score}</strong>
      </div>
    `).join("");
  }

  function persistResult() {
    const rankings = [
      { username: Auth.currentUser(), score },
      { username: "Nova", score: Math.max(score - 90, 120) },
      { username: "Byte", score: Math.max(score - 160, 80) }
    ].sort((a, b) => b.score - a.score);

    Common.saveSession({ resultSnapshot: JSON.stringify({ roomCode, rankings }) });
  }

  return { init };
})();
