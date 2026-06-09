const ResultPage = (() => {
  function init() {
    Common.renderShell("result");
    render();
    bindEvents();
  }

  function getResults() {
    const snapshot = Common.getSession("resultSnapshot", "");
    if (snapshot) return JSON.parse(snapshot);

    return {
      roomCode: Common.getParam("roomCode", "DEMO01"),
      rankings: [
        { username: "Maya", score: 920 },
        { username: "Arjun", score: 860 },
        { username: Auth.currentUser(), score: 790 }
      ]
    };
  }

  function render() {
    const result = getResults();
    const winner = result.rankings[0];

    document.querySelector("#winnerName").textContent = winner.username;
    document.querySelector("#winnerScore").textContent = winner.score;
    document.querySelector("#resultRoomCode").textContent = result.roomCode;
    document.querySelector("#rankingTable").innerHTML = result.rankings.map((player, index) => `
      <tr class="ranking-row">
        <td class="fw-bold">#${index + 1}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="avatar">${Common.initials(player.username)}</span>
            <span>${Common.escapeHtml(player.username)}</span>
          </div>
        </td>
        <td class="text-end fw-bold">${player.score}</td>
      </tr>
    `).join("");
  }

  function bindEvents() {
    document.querySelector("#playAgainBtn")?.addEventListener("click", () => {
      window.location.href = "join-room.html";
    });
  }

  return { init };
})();
