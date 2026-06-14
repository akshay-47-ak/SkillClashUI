const LobbyPage = (() => {
  let roomId = "";
  let roomCode = "";
  let members = [];
  let refreshTimer = null;
  let refreshEndpoint = "";
  let refreshProbeFailed = false;

  function init() {
    Common.renderShell("lobby");
    roomCode = Common.getParam("roomCode", Common.getSession("roomCode", "DEMO01")).toUpperCase();
    roomId = Common.getParam("roomId", Common.getSession("roomId", roomCode));
    hydrateFromStorage();
    render();
    bindEvents();
    refreshRoom();
    startRoomRefresh();
    connectRealtime();
  }

  function hydrateFromStorage() {
    const room = parseStoredRoom();
    members = room.members || [
      { username: Auth.currentUser(), host: Common.getSession("isHost", "true") === "true", score: 0 }
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
      const roomTopics = new Set([roomId, roomCode].filter(Boolean).map((value) => `/topic/room/${value}`));

      for (const topic of roomTopics) {
        await SkillClashSocket.subscribe(topic, handleRoomUpdate);
      }

      await SkillClashSocket.subscribe(`/topic/rooms/${roomCode}/members`, (payload) => {
        updateMembers(payload);
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

  async function refreshRoom() {
    if (refreshProbeFailed) return false;

    const endpoints = refreshEndpoint ? [refreshEndpoint] : [
      `/room/${roomCode}`,
      `/room/${roomCode}/members`,
      `/rooms/${roomCode}`,
      `/rooms/${roomCode}/members`
    ];

    for (const endpoint of endpoints) {
      try {
        const payload = await Api.get(endpoint);
        if (updateMembers(payload)) {
          refreshEndpoint = endpoint;
          persistSnapshot(payload);
          render();
          return true;
        }
      } catch {
        continue;
      }
    }

    refreshProbeFailed = !refreshEndpoint;
    return false;
  }

  function startRoomRefresh() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(refreshRoom, 3000);
    window.addEventListener("beforeunload", () => window.clearInterval(refreshTimer), { once: true });
  }

  function handleRoomUpdate(payload) {
    updateMembers(payload);
    persistSnapshot(payload);
    if (payload?.event === "MEMBER_JOINED" && payload.message) {
      Common.showToast(payload.message);
    }
    render();
  }

  function updateMembers(payload) {
    const nextMembers = extractMembers(payload);
    if (!nextMembers.length) return false;
    members = nextMembers;
    return true;
  }

  function extractMembers(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    return [
      payload.members,
      payload.players,
      payload.users,
      payload.participants,
      payload.data?.members,
      payload.data?.players,
      payload.room?.members,
      payload.room?.players
    ].find(Array.isArray) || [];
  }

  function persistSnapshot(payload) {
    if (!payload || typeof payload !== "object") return;
    const nextRoomId = payload.roomId || payload.id || payload.room?.roomId || payload.room?.id;
    if (nextRoomId) roomId = String(nextRoomId);
    Common.saveSession({ roomId, roomSnapshot: JSON.stringify({ ...parseStoredRoom(), ...payload, members }) });
  }

  function parseStoredRoom() {
    try {
      return JSON.parse(Common.getSession("roomSnapshot", "")) || {};
    } catch {
      return {};
    }
  }

  function memberName(member) {
    if (typeof member === "string") return member;
    return member.username || member.userName || member.name || "Player";
  }

  return { init };
})();
