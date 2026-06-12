const RoomPage = (() => {
  function localRoom(payload = {}) {
    const roomCode = payload.roomCode || Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      roomId: payload.roomId || roomCode,
      roomCode,
      roomName: payload.roomName || "Skill Battle",
      maxPlayers: Number(payload.maxPlayers || 8),
      category: payload.category || "Brain Blitz",
      host: payload.username || Auth.currentUser(),
      members: [{ username: payload.username || Auth.currentUser(), host: payload.host !== false, score: 0 }]
    };
  }

  function initCreateRoom() {
    Common.renderShell("create");
    const username = Auth.currentUser();
    const usernameInput = document.querySelector("#username");
    if (usernameInput) usernameInput.value = username;

    document.querySelector("#createRoomForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector("button[type='submit']");
      const payload = { username };

      try {
        setSubmitting(submitButton, true, "Creating...");
        const roomCode = normalizeRoomCode(await Api.post("/room/create", payload));

        if (!roomCode) {
          throw new Error("Room created, but the server did not return a room code.");
        }

        const room = localRoom({ roomCode, username, roomName: "Skill Battle" });
        persistRoom(room, true);
      } catch (error) {
        Common.showToast(error.message || "Unable to create room.", "error");
        setSubmitting(submitButton, false, "Create Room");
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
        const roomId = normalizeRoomId(await Api.post("/room/join", { userName: username, roomCode }));

        if (!roomId) {
          throw new Error("Joined room, but the server did not return a room id.");
        }

        const room = localRoom({ roomId, roomCode, username, roomName: "Skill Battle", host: false });
        persistRoom(room, false);
      } catch (error) {
        if (error.isApiError) {
          Common.showToast(error.message || "Unable to join room.", "error");
          return;
        }

        const room = localRoom({ roomCode, username, roomName: "Demo Arena", host: false });
        room.members.push({ username: "Host", host: true, score: 0 });
        persistRoom(room, false);
        Common.showToast("Backend unavailable. Joined a local demo room.", "error");
      }
    });
  }

  function persistRoom(room, isHost) {
    const roomCode = room.roomCode || room.code || "";
    const roomId = room.roomId || room.id || roomCode;

    Common.saveSession({
      roomId,
      roomCode,
      roomName: room.roomName || room.name || "Skill Battle",
      category: room.category || "Mixed",
      maxPlayers: room.maxPlayers || 8,
      isHost: String(isHost),
      roomSnapshot: JSON.stringify(room)
    });

    const params = new URLSearchParams({ roomCode, roomId });
    window.location.href = `lobby.html?${params.toString()}`;
  }

  function normalizeRoomCode(response) {
    if (typeof response === "string") return response.trim();
    if (response && typeof response === "object") {
      return String(response.roomCode || response.RoomCode || response.code || "").trim();
    }
    return "";
  }

  function normalizeRoomId(response) {
    if (typeof response === "string") return response.trim();
    if (response && typeof response === "object") {
      return String(response.roomId || response.RoomId || response.id || "").trim();
    }
    return "";
  }

  function setSubmitting(button, isSubmitting, label) {
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = label;
  }

  return { initCreateRoom, initJoinRoom };
})();
