# De-Disabled: Universal Hands-Free Web Accessibility Portal 


![Platform](https://img.shields.io/badge/Platform-Web_/_PWA-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_TypeScript_|_Tailwind_|_MediaPipe-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)


**Inclusion for Social Impact** — a browser-based, zero-backend accessibility platform that gives people with visual, motor, and cognitive disabilities independent access to voting, reading, media, and learning tools using only voice, eye/head tracking, and standard webcams.

Winner — CUCKS-AITHON 2026, Central University of Karnataka.

## The Problem

- Traditional voting and digital systems lack accessibility features, excluding citizens with disabilities from participating fully.
- ~15% of the global population lives with a disability, yet most systems still assume a single, able-bodied interaction mode (mouse + keyboard).
- Existing accessible e-voting/e-learning solutions typically require expensive backend infrastructure, raising cost and security concerns.

De-Disabled addresses this by running **entirely in the browser** — no servers, no backend, no external infrastructure required.

## Features

| Module | Route | Description |
|---|---|---|
| 🗳️ **Accessible Voting** | `/vote` | Cast ballots via voice commands or eye-tracking (MediaPipe FaceMesh); votes are encrypted client-side with the Web Crypto API and return a verifiable receipt hash. |
| 📖 **Head-Tracking Reader** | `/reading` | Hands-free reading interface controlled by head movement (dwell-based cursor) — scroll, zoom, and navigate without touch. |
| 🎬 **Head-Tracking Media Player** | `/media` | Play/pause, skip, and adjust volume using head movement as a virtual cursor, ideal for users with limited motor control. |
| 🎓 **Welfare Hub** | `/welfare` | An interactive learning and rewards hub (emotions, numbers, safety concepts) with a streak/star reward system, designed for cognitive accessibility and engagement. |

### Core Capabilities

- 🎙️ **Voice Commands** — navigate and interact using natural speech via the Web Speech API.
- 👁️ **Eye & Head Tracking** — on-device tracking powered by MediaPipe (FaceMesh / Face Landmarker); yaw/pitch/roll is mapped to a virtual cursor entirely client-side.
- 🔒 **Cryptographic Security** — ballots are encrypted locally in the browser using the Web Crypto API, producing a verifiable receipt hash without any server round-trip.
- 📴 **Offline-Capable / Zero Server** — 100% client-side processing with `localStorage` persistence; deployable in low-connectivity or rural environments.
- 🔑 **User Authentication** — an authentication step gates access before interface selection to protect vote integrity.
- ⚡ **Instant, Zero-Cost Deployment** — static frontend deployment with no backend costs, making it scalable for institutions and accessibility research.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS, shadcn/ui, Radix UI primitives, Framer Motion
- **Vision AI:** MediaPipe (`@mediapipe/face_mesh`, `@mediapipe/camera_utils`) for on-device eye/head tracking
- **Voice:** Web Speech API
- **Security:** Web Crypto API
- **Storage:** Browser `localStorage` (no database, no backend)
- **Routing/State:** React Router, TanStack Query
- **Testing:** Vitest, Testing Library

### How It Works

1. **Input** — User authenticates, then selects an interface (Audio / Visual / Standard).
2. **Process** — MediaPipe FaceMesh tracks eye/head movement for gaze- or head-based control; the Web Speech API interprets voice commands.
3. **Output** — Actions (e.g., a vote) are encrypted client-side and produce a verifiable receipt hash; where applicable, results are visualized locally in real time.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended) and npm
- A webcam and microphone for eye-tracking and voice-command features
- A modern browser (Chrome/Edge recommended for full Web Speech API and MediaPipe support)

### Installation

```bash
# Clone the repository
git clone https://github.com/ajai-26/De-Disabled.git
cd De-Disabled

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
De-Disabled/
├── public/              # Static assets
├── src/
│   ├── assets/           # Images and media assets
│   ├── components/       # Reusable UI + landing page sections
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom hooks (e.g., useHeadCursor)
│   ├── pages/              # Route-level pages (Vote, Reading, MediaPlayer, WelfareHub, ...)
│   ├── lib/                # Utilities
│   ├── test/                # Test setup/specs
│   ├── App.tsx              # App shell & routing
│   └── main.tsx              # Entry point
├── package.json
└── vite.config.ts
```

## Privacy & Security Notes

- All video/audio processing for eye-tracking and voice commands happens **on-device in the browser** — no camera or microphone stream is ever sent to a server.
- Votes are encrypted using the browser's native **Web Crypto API** before being stored, and each vote yields a receipt hash for user-side verification.
- Data persistence uses `localStorage`, so no external database or backend is required.

## Team

- Ajai Kumar S
- Arul Aravind
- Harish A
- Asvat V S

##  License

This project is licensed under the MIT License.
