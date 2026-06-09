const RoomPage = (() => {
  const categories = ["Java", "Spring Boot", "JavaScript", "Databases", "System Design"];

  function localRoom(payload = {}) {
    const roomCode = payload.roomCode || Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      roomCode,
      roomName: payload.roomName || "Skill Battle",
      maxPlayers: Number(payload.maxPlayers || 8),
      category: payload.category || "Java",
      host: payload.username || Auth.currentUser(),
      members: [{ username: payload.username || Auth.currentUser(), host: payload.host !== false, score: 0 }]
    };
  }

  function renderCategoryOptions(select) {
    if (!select) return;
    select.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  }

  function initCreateRoom() {
    Common.renderShell("create");
    renderCategoryOptions(document.querySelector("#category"));

    document.querySelector("#createRoomForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const payload = {
        roomName: form.get("roomName").trim(),
        maxPlayers: Number(form.get("maxPlayers")),
        category: form.get("category"),
        username: Auth.currentUser()
      };

      try {
        const room = await Api.post("/rooms", payload);
        persistRoom(room, true);
      } catch (error) {
        const room = localRoom(payload);
        persistRoom(room, true);
        Common.showToast("Backend unavailable. Created a local demo room.", "error");
      }
    });
  }

  function initJoinRoom() {
    Common.renderShell("join");

    document.querySelector("#joinRoomForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const username = form.get("username").trim();
      const roomCode = form.get("roomCode").trim().toUpperCase();
      Auth.setUser(username);

      try {
        const room = await Api.post(`/rooms/${roomCode}/join`, { username });
        persistRoom(room, false);
      } catch (error) {
        const room = localRoom({ roomCode, username, roomName: "Demo Arena", host: false });
        room.members.push({ username: "Host", host: true, score: 0 });
        persistRoom(room, false);
        Common.showToast("Backend unavailable. Joined a local demo room.", "error");
      }
    });
  }

  function persistRoom(room, isHost) {
    Common.saveSession({
      roomCode: room.roomCode || room.code,
      roomName: room.roomName || room.name || "Skill Battle",
      category: room.category || "Mixed",
      maxPlayers: room.maxPlayers || 8,
      isHost: String(isHost),
      roomSnapshot: JSON.stringify(room)
    });

    window.location.href = `lobby.html?roomCode=${encodeURIComponent(room.roomCode || room.code)}`;
  }

  return { initCreateRoom, initJoinRoom };
})();
