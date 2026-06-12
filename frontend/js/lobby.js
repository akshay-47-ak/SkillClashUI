const LobbyPage = (() => {
  let roomId = "";
  let roomCode = "";
  let members = [];

  function init() {
    Common.renderShell("lobby");
    roomCode = Common.getParam("roomCode", Common.getSession("roomCode", "DEMO01")).toUpperCase();
    roomId = Common.getParam("roomId", Common.getSession("roomId", roomCode));
    hydrateFromStorage();
    render();
    bindEvents();
    connectRealtime();
  }

  function hydrateFromStorage() {
    const snapshot = Common.getSession("roomSnapshot", "");
    const room = snapshot ? JSON.parse(snapshot) : {};
    members = room.members || [
      { username: Auth.currentUser(), host: Common.getSession("isHost", "true") === "true", score: 0 },
      { username: "Nova", host: false, score: 0 },
      { username: "Byte", host: false, score: 0 }
    ];
  }

  function roomInfo() {
    return {
      roomCode,
      roomName: Common.getSession("roomName", "Skill Battle"),
      category: Common.getSession("category", "Mixed"),
      maxPlayers: Common.getSession("maxPlayers", "8"),
      isHost: Common.getSession("isHost", "true") === "true"
    };
  }

  function render() {
    const room = roomInfo();
    document.querySelector("#roomName").textContent = room.roomName;
    document.querySelector("#roomCode").textContent = room.roomCode;
    document.querySelector("#roomCategory").textContent = room.category;
    document.querySelector("#playerCount").textContent = `${members.length}/${room.maxPlayers}`;
    document.querySelector("#startMatchBtn").hidden = !room.isHost;

    document.querySelector("#membersList").innerHTML = members.map((member) => `
      <li class="sc-card-muted p-3 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-3">
          <span class="avatar">${Common.initials(memberName(member))}</span>
          <div>
            <div class="fw-bold">${Common.escapeHtml(memberName(member))}</div>
            <div class="text-slate-400 small">${member.score || 0} points</div>
          </div>
        </div>
        ${member.host ? '<span class="host-badge">HOST</span>' : ""}
      </li>
    `).join("");
  }

  function bindEvents() {
    document.querySelector("#copyCodeBtn")?.addEventListener("click", async () => {
      await navigator.clipboard?.writeText(roomCode);
      Common.showToast("Room code copied.");
    });

    document.querySelector("#startMatchBtn")?.addEventListener("click", async () => {
      try {
        await Api.post(`/rooms/${roomCode}/start`, {});
        await SkillClashSocket.publish(`/app/rooms/${roomCode}/start`, { roomCode });
      } catch {
        Common.showToast("Starting local demo match.");
      }
      window.location.href = `quiz.html?roomCode=${encodeURIComponent(roomCode)}`;
    });
  }

  async function connectRealtime() {
    try {
      await SkillClashSocket.subscribe(`/topic/room/${roomId}`, (payload) => {
        members = payload.members || members;
        if (payload.event === "MEMBER_JOINED" && payload.message) {
          Common.showToast(payload.message);
        }
        render();
      });

      await SkillClashSocket.subscribe(`/topic/rooms/${roomCode}/members`, (payload) => {
        members = payload.members || payload || members;
        render();
      });

      await SkillClashSocket.subscribe(`/topic/rooms/${roomCode}/events`, (payload) => {
        if (payload.type === "MATCH_STARTED" || payload.event === "MATCH_STARTED") {
          window.location.href = `quiz.html?roomCode=${encodeURIComponent(roomCode)}`;
        }
      });
    } catch {
      Common.showToast("Realtime connection unavailable. Lobby is in demo mode.", "error");
    }
  }

  function memberName(member) {
    return member.username || member.userName || member.name || "Player";
  }

  return { init };
})();
