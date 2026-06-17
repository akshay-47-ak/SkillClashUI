# SkillClash Frontend

Static frontend for SkillClash, a friend-based practice platform for programmers preparing for IT jobs, campus placements, online assessments, and technical interviews.

The public landing page is designed with a clean, light visual style and speaks to students and developers who want to practice programming, aptitude, and interview fundamentals together.

## Features

- Landing page for IT job and interview preparation
- Login and registration modals
- Private practice room flow
- Create room and join room pages
- Real-time lobby experience
- Timed quiz rounds
- Final result and ranking page
- Backend settings stored in the browser

## Stack

- HTML5
- CSS3
- JavaScript ES6+
- Tailwind CSS via CDN
- Bootstrap 5 via CDN
- SockJS client via CDN
- STOMP client via CDN

No React, Angular, Vue, npm, Vite, Webpack, jQuery, or TypeScript.

## Pages

- `index.html` - Public landing page with login and registration
- `pages/home.html` - Authenticated home screen
- `pages/create-room.html` - Create a private practice room
- `pages/join-room.html` - Join using a room code
- `pages/lobby.html` - Wait for friends before starting
- `pages/quiz.html` - Timed question round
- `pages/result.html` - Scores and rankings

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

The app flow after authentication starts at `pages/home.html`.

If your backend already uses port `8080`, run the static frontend on another port:

```bash
cd frontend
python3 -m http.server 8081
```

Open `http://localhost:8081`.

## Backend Integration

Default REST base URL:

```text
http://localhost:8080
```

Default WebSocket URL:

```text
ws://localhost:8080/ws
```

Use the **Settings** button in the navbar to change both values in the browser.

The realtime client uses STOMP over SockJS, matching a Spring endpoint configured with `registry.addEndpoint("/ws").withSockJS()`.

## Landing Page Direction

The landing page should stay focused on:

- Programmers preparing for IT jobs
- Practicing with friends or classmates
- Coding, DSA, aptitude, and interview concepts
- Light, decent colors instead of bold dark themes
- Company and coding-platform preparation cues such as Google, Amazon, Microsoft, Infosys, TCS, LeetCode, HackerRank, and CodeChef
