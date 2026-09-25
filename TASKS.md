# BlackHoleIO Project Task List

> A real-time browser-based multiplayer black hole game (agar.io-style).
> **Stack:** React + Vite (client) Node.js + Socket.IO (game server) Python + FastAPI (backend API)

---

## Phase 1 Project Setup & Scaffolding

- [x] Initialize monorepo structure (e.g., `/client`, `/server`, `/api` folders)
- [x] Set up **Vite + React** in `/client`
- [x] Install dependencies (`react`, `react-dom`, `vite`)
- [x] Configure `vite.config.ts`
- [x] Add base ESLint / Prettier config
- [x] Set up **Node.js + Socket.IO** game server in `/server`
- [x] Initialize `package.json`
- [x] Install `socket.io`, `express`, `dotenv`
- [x] Create basic `server.js` entry point
- [x] Set up **Python + FastAPI** in `/api`
- [x] Create virtual environment (`uv` or `venv`)
- [x] Install `fastapi`, `uvicorn`, `pydantic`
- [x] Create basic `main.py` entry point
- [x] Create root-level `.gitignore` covering Node, Python, and Vite artifacts
- [x] Write initial `README.md` with setup instructions
- [x] Set up environment variable files (`.env.example` for each sub-project)

---

## Phase 2  Core Game Mechanics (Client-Side)

- [ ] Create a fullscreen `<canvas>` game renderer
- [ ] Implement basic game loop (`requestAnimationFrame`)
- [ ] Design the **black hole entity**
- [ ] Visual: animated gravitational lensing ring effect
- [ ] Size grows as mass is absorbed
- [ ] Player-controlled movement (mouse or WASD)
- [ ] Implement **world map** with wrap-around or bounded edges
- [ ] Add **floating mass objects** (stars, debris) scattered across the map
- [ ] Implement **absorption logic**  player absorbs smaller objects/players on contact
- [ ] Add **camera/viewport** that follows the player's black hole
- [ ] Add **minimap** showing player positions
- [ ] Implement **leaderboard UI** (live ranking by mass)

---

## Phase 3  Real-Time Multiplayer (Socket.IO)

- [ ] Design the **game state model** (players, positions, masses, entities)
- [ ] Server: manage game rooms/lobbies
- [ ] Server: broadcast authoritative game state on a fixed tick rate (e.g., 20 TPS)
- [ ] Client: send player input (direction/velocity) to server
- [ ] Client: receive and interpolate game state updates smoothly
- [ ] Handle **player join / disconnect** events gracefully
- [ ] Implement **collision detection** server-side (authoritative)
- [ ] Implement **spawning logic**  respawn players after being absorbed
- [ ] Add **lag compensation** / client-side prediction basics

---

## Phase 4  Backend API (FastAPI)

- [ ] Design API routes:
  - [ ] `POST /auth/register`  create account
  - [ ] `POST /auth/login`  authenticate and return JWT
  - [ ] `GET /leaderboard`  fetch all-time top players
  - [ ] `POST /game/score`  submit a match score
  - [ ] `GET /player/{id}`  fetch player profile & stats
- [ ] Set up a database (PostgreSQL or SQLite for dev)
- [ ] Define models: `User`, `Score`, `Match`
- [ ] Implement JWT authentication middleware
- [ ] Connect Node.js game server to FastAPI (HTTP calls or shared DB) to persist scores
- [ ] Add CORS configuration for client origin

---

## Phase 5  UI / UX & Visual Polish

- [ ] Design a **landing / home screen** (enter username, play button)
- [ ] Create an animated **menu background** (particle / space theme)
- [ ] Style the **HUD** (mass counter, timer, kill feed)
- [ ] Add smooth **animations** for absorption events (ripple / shockwave effect)
- [ ] Add **particle effects** when absorbing mass
- [ ] Implement **screen shake** on absorbing a large player
- [ ] Add **sound effects** (background ambient, absorption pop, death sound)
- [ ] Make layout fully **responsive** for different screen sizes
- [ ] Add a **game over / death screen** with score summary and play-again button
- [ ] Dark space theme with glowing black holes and neon accents

---

## Phase 6  Game Features & Content

- [ ] Add **power-ups** that spawn on the map (speed boost, mass burst, shield)
- [ ] Add **game modes**:
  - [ ] Free-for-all (default)
  - [ ] Teams (2-4 teams)
  - [ ] Battle Royale (shrinking safe zone)
- [ ] Implement **player skins / colors** (selectable pre-game)
- [ ] Add **chat system** in-game (via Socket.IO)
- [ ] Implement **spectator mode** for eliminated players

---

## Phase 7  Testing & Quality Assurance

- [ ] Unit test game logic (mass absorption formulas, collision detection)
- [ ] Integration test Socket.IO events (join, move, absorb, disconnect)
- [ ] API tests for all FastAPI endpoints (pytest)
- [ ] End-to-end test the full game loop (Playwright or Cypress)
- [ ] Load test the Socket.IO server with simulated concurrent players
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## Phase 8  Deployment

- [ ] Containerize services with **Docker**
  - [ ] `Dockerfile` for Node.js game server
  - [ ] `Dockerfile` for FastAPI backend
  - [ ] `Dockerfile` for React/Vite client (static build)
  - [ ] `docker-compose.yml` for local orchestration
- [ ] Choose a cloud provider (e.g., Railway, Render, Fly.io, AWS)
- [ ] Set up CI/CD pipeline (GitHub Actions)
  - [ ] Lint + test on every PR
  - [ ] Auto-deploy `main` branch
- [ ] Configure domain, SSL (HTTPS + WSS for Socket.IO)
- [ ] Set up environment secrets in the deployment platform
- [ ] Monitor with logging (e.g., Logtail, Datadog, or self-hosted)

---

## Backlog / Nice-to-Haves

- [ ] Mobile touch controls
- [ ] Progressive Web App (PWA) support
- [ ] Discord OAuth login
- [ ] Replay system (record and play back matches)
- [ ] AI bots to fill empty lobbies
- [ ] Custom game rooms with share links
- [ ] Season-based ranked leaderboard

---

*Last updated: 2026-09-21*
