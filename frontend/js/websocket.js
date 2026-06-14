const SkillClashSocket = (() => {
  const DEFAULT_WS_URL = "ws://localhost:8080/ws";
  const STORAGE_KEY = "skillclash_ws_url";
  const subscriptions = new Map();
  let client = null;
  let connected = false;
  let connectPromise = null;
  let resolveConnect = null;
  let rejectConnect = null;

  function getUrl() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_WS_URL;
  }

  function setUrl(url) {
    const normalized = String(url || DEFAULT_WS_URL).trim();
    localStorage.setItem(STORAGE_KEY, normalized);
    resetClient();
    return normalized;
  }

  function socketUrl() {
    return toHttpUrl(getUrl().replace(/\/websocket$/, ""));
  }

  function toHttpUrl(url) {
    return url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  }

  function notifyStatus(status) {
    window.dispatchEvent(new CustomEvent("skillclash:socket-status", { detail: { status } }));
  }

  function ensureLibraries() {
    if (!window.SockJS || !window.StompJs?.Client) {
      throw new Error("Realtime libraries are not loaded.");
    }
  }

  function connect() {
    if (connected) return Promise.resolve();
    if (connectPromise) return connectPromise;

    notifyStatus("connecting");

    connectPromise = new Promise((resolve, reject) => {
      resolveConnect = resolve;
      rejectConnect = reject;
    });

    try {
      ensureLibraries();
      client = new StompJs.Client({
        webSocketFactory: () => new SockJS(socketUrl()),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => undefined,
        onConnect: () => {
          connected = true;
          notifyStatus("connected");
          subscriptions.forEach((subscription) => attachSubscription(subscription));
          resolveConnect?.();
          connectPromise = null;
          resolveConnect = null;
          rejectConnect = null;
        },
        onStompError: () => {
          notifyStatus("error");
        },
        onWebSocketClose: () => {
          connected = false;
          notifyStatus("disconnected");
          subscriptions.forEach((subscription) => {
            subscription.stompSubscription = null;
          });
        },
        onWebSocketError: () => {
          notifyStatus("error");
        }
      });

      client.activate();
    } catch (error) {
      notifyStatus("error");
      rejectConnect?.(error);
      connectPromise = null;
      resolveConnect = null;
      rejectConnect = null;
      return Promise.reject(error);
    }

    return connectPromise || Promise.resolve();
  }

  function subscribe(destination, handler) {
    const subscription = { destination, handler, stompSubscription: null };
    subscriptions.set(destination, subscription);

    if (connected) {
      attachSubscription(subscription);
    } else {
      connect().catch(() => undefined);
    }

    return () => {
      subscription.stompSubscription?.unsubscribe();
      subscriptions.delete(destination);
    };
  }

  function attachSubscription(subscription) {
    if (!client?.connected || subscription.stompSubscription) return;

    subscription.stompSubscription = client.subscribe(subscription.destination, (message) => {
      try {
        subscription.handler(JSON.parse(message.body));
      } catch {
        subscription.handler(message.body);
      }
    });
  }

  async function publish(destination, body = {}) {
    await connect();
    client.publish({
      destination,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  function disconnect() {
    subscriptions.forEach((subscription) => {
      subscription.stompSubscription?.unsubscribe();
      subscription.stompSubscription = null;
    });
    resetClient();
    notifyStatus("disconnected");
  }

  function resetClient() {
    connected = false;
    connectPromise = null;
    resolveConnect = null;
    rejectConnect = null;

    if (client) {
      client.deactivate();
      client = null;
    }
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
