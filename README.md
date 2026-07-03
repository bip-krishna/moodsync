# MoodSync — AI Mood-Based Music Visualizer

A full-stack app that detects your emotion via webcam and plays music matched to your mood, with real-time 3D audio visualization.

## How It Works

1. **Webcam captures your face** — the frontend sends frames to the backend
2. **DeepFace analyzes emotion** — detects happy, sad, angry, relaxed, excited, neutral, surprised, stressed
3. **YouTube Music recommends songs** — mood-matched playlists via `ytmusicapi`
4. **Three.js visualizer** — reactive 3D audio visualization powered by `@react-three/fiber`
5. **Lyrics fetched in real-time** — synced lyrics from LRCLIB, with fallback to YouTube Music

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js Frontend   │  POST   │   FastAPI Backend         │
│  (Three.js, Webcam,  │ ◄─────► │  (DeepFace, YTMusic,     │
│   YouTube Player)    │  SSE    │   LRCLIB)                │
└─────────────────────┘         └──────────────────────────┘
```

### Frontend
- **Next.js 16** with React 19 and TypeScript
- **Three.js** via `@react-three/fiber` / `@react-three/drei` — 3D wave visualizer (mood-reactive colours, audio-reactive amplitude)
- **react-webcam** — real-time face capture
- **react-youtube** — embedded YouTube player
- **Framer Motion** — animations and transitions
- **Meyda** — audio feature extraction (energy, bass)
- **Tailwind CSS v4** — styling
- **Supabase + Clerk** — auth and data persistence

### Backend
- **FastAPI** — Python async HTTP server
- **DeepFace (TensorFlow)** — facial emotion analysis
- **ytmusicapi** — YouTube Music search and recommendations
- **LRCLIB** — synced lyrics lookup
- **OpenCV** — image processing

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and point your webcam at your face.

## Environment Variables (Frontend)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth key |
| `CLERK_SECRET_KEY` | Clerk secret key |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/analyze-emotion` | Upload an image, returns emotion scores |
| `GET` | `/recommend-music/{mood}` | Returns mood-matched YouTube Music tracks |
| `GET` | `/lyrics/{video_id}` | Fetches lyrics (synced or plain) |

## License

MIT — Copyright (c) 2026 Krishna Jha
