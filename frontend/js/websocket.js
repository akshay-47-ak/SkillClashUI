const SkillClashSocket = (() => {
  const DEFAULT_WS_URL = "ws://localhost:8080/ws";
  const STORAGE_KEY = "skillclash_ws_url";
  const subscriptions = new Map();
  let socket = null;
  let connected = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;

  function getUrl() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_WS_URL;
  }

  function setUrl(url) {
    const normalized = String(url || DEFAULT_WS_URL).trim();
    localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }

  function frame(command, headers = {}, body = "") {
    const lines = [command, ...Object.entries(headers).map(([key, value]) => `${key}:${value}`), "", body];
    return `${lines.join("\n")}\0`;
  }

  function parseFrames(data) {
    return String(data)
      .split("\0")
      .filter(Boolean)
      .map((raw) => {
        const [head, body = ""] = raw.split("\n\n");
        const [command, ...headerLines] = head.split("\n");
        const headers = Object.fromEntries(headerLines.filter(Boolean).map((line) => {
          const index = line.indexOf(":");
          return [line.slice(0, index), line.slice(index + 1)];
        }));

        return { command, headers, body };
      });
  }

  function notifyStatus(status) {
    window.dispatchEvent(new CustomEvent("skillclash:socket-status", { detail: { status } }));
  }

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    notifyStatus("connecting");

    return new Promise((resolve, reject) => {
      socket = new WebSocket(getUrl());

      socket.addEventListener("open", () => {
        socket.send(frame("CONNECT", {
          "accept-version": "1.2",
          "heart-beat": "10000,10000"
        }));
      });

      socket.addEventListener("message", (event) => {
        parseFrames(event.data).forEach((message) => {
          if (message.command === "CONNECTED") {
            connected = true;
            reconnectAttempts = 0;
            notifyStatus("connected");
            subscriptions.forEach((subscription, destination) => {
              socket.send(frame("SUBSCRIBE", { id: subscription.id, destination }));
            });
            resolve();
          }

          if (message.command === "MESSAGE") {
            const destination = message.headers.destination || message.headers.subscription;
            const subscription = subscriptions.get(destination) || [...subscriptions.values()].find((item) => item.id === message.headers.subscription);
            if (!subscription) return;

            try {
              subscription.handler(JSON.parse(message.body));
            } catch {
              subscription.handler(message.body);
            }
          }

          if (message.command === "ERROR") {
            notifyStatus("error");
          }
        });
      });

      socket.addEventListener("close", () => {
        connected = false;
        notifyStatus("disconnected");
        scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        notifyStatus("error");
        reject(new Error("WebSocket connection failed."));
      });
    });
  }

  function scheduleReconnect() {
    window.clearTimeout(reconnectTimer);
    reconnectAttempts += 1;
    const delay = Math.min(1000 * reconnectAttempts, 8000);
    reconnectTimer = window.setTimeout(connect, delay);
  }

  async function subscribe(destination, handler) {
    const id = `sub-${subscriptions.size + 1}-${Date.now()}`;
    subscriptions.set(destination, { id, handler });
    await connect();

    if (connected) {
      socket.send(frame("SUBSCRIBE", { id, destination }));
    }

    return () => {
      const subscription = subscriptions.get(destination);
      if (subscription && connected) {
        socket.send(frame("UNSUBSCRIBE", { id: subscription.id }));
      }
      subscriptions.delete(destination);
    };
  }

  async function publish(destination, body = {}) {
    await connect();
    socket.send(frame("SEND", { destination, "content-type": "application/json" }, JSON.stringify(body)));
  }

  function disconnect() {
    window.clearTimeout(reconnectTimer);
    if (socket && connected) {
      socket.send(frame("DISCONNECT"));
    }
    socket?.close();
    socket = null;
    connected = false;
    notifyStatus("disconnected");
  }

  return {
    connect,
    disconnect,
    getUrl,
    setUrl,
    subscribe,
    publish
  };
})();
