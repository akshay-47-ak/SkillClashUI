# SkillClash Frontend

Static frontend for a real-time multiplayer quiz battle platform.

## Stack

- HTML5
- CSS3
- JavaScript ES6+
- Tailwind CSS via CDN
- Bootstrap 5 via CDN

No React, Angular, Vue, npm, Vite, Webpack, jQuery, or TypeScript.

## File Structure

```text
frontend/
├── index.html
├── pages/
│   ├── home.html
│   ├── create-room.html
│   ├── join-room.html
│   ├── lobby.html
│   ├── quiz.html
│   └── result.html
├── css/
│   ├── style.css
│   └── components.css
├── js/
│   ├── landing.js
│   ├── api.js
│   ├── websocket.js
│   ├── auth.js
│   ├── room.js
│   ├── lobby.js
│   ├── quiz.js
│   ├── result.js
│   ├── common.js
│   └── page-init.js
└── assets/
    ├── images/
    └── icons/
```

## Run

```bash
cd frontend
python3 -m http.server 8080
```

Open `http://localhost:8080`.

`index.html` is the public landing page with login and registration modals. The app flow after authentication starts at `pages/home.html`.

## Backend Integration

Default REST base URL:

```text
http://localhost:8080/api
```

Default WebSocket URL:

```text
ws://localhost:8080/ws
```

Use the **Settings** button in the navbar to change both values in the browser.

The WebSocket client uses native browser `WebSocket` and sends STOMP 1.2 frames directly, so it can work with Spring WebSocket/STOMP without adding frontend packages.
