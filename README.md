# Auto Clipper

**AI-Powered Viral Video Clipper (Enterprise Architecture)**

Auto Clipper uses AI (Google Gemini or OpenAI — your choice) to semantically analyze long-form video transcripts, identify the most viral moments, and autonomously generate short, shareable clips using zero-copy FFmpeg fast-seek.

## 🌟 Key Features

- **Semantic AI Analysis** &mdash; Gemini or OpenAI identifies optimal clip candidates based on emotional resonance, hook potential, and pacing, completely bypassing the need for computationally heavy visual processing.
- **Microsecond Clipping** &mdash; Uses FFmpeg Fast Seek (`-ss` before `-i`) to jump directly to keyframes, extracting clips in milliseconds regardless of source video length.
- **Supabase Postgres Cluster** &mdash; Highly available data storage with connection pooling (`pool_pre_ping`) to handle concurrent asynchronous clipping jobs.
- **Role-Based Access Control (RBAC)** &mdash; JWT-secured admin and sub-user hierarchies. Users are invited/managed exclusively by administrators via the dashboard.
- **Live Server-Sent Events (SSE)** &mdash; Real-time status updates stream directly to the React frontend during long-running AI inference tasks.
- **Advanced Metrics Dashboard** &mdash; Powered by Recharts. Features multi-metric radar charts, gradient area charts, and treemaps for tracking virality scores, clip generation velocity, and user activity.
- **Optional GPU Transcription** &mdash; Built-in `faster-whisper` integration for videos lacking transcripts (quantized for 4x speedup), with zero-latency fallback to sidecar `.srt` or `.txt` files.

## 🚀 Quick Start (Local Deployment)

*Local deployment is recommended to avoid bandwidth costs when processing massive raw video files.*

1. **Backend (FastAPI)**:
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Duplicate .env.example to .env and add your API keys
   # Supports Gemini, OpenAI, or both (auto-detects from whichever key you provide)
   
   # Seed your initial Admin account
   python seed_admin.py admin@yourdomain.com your_secure_password "Admin Name"
   
   # Start the server with pooling enabled
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend (React/Vite)**:
   ```bash
   cd frontend
   npm install
   
   # Create frontend/.env with VITE_API_URL=http://localhost:8000
   npm run dev
   ```
3. **Open**: [http://localhost:5173](http://localhost:5173) and login with your seeded admin credentials.

## 🐳 Docker Deployment (Recommended)

To deploy the entire stack (Backend, Frontend, and secure Cloudflare Tunnel) with one command, use the included Docker Compose configuration.

1. **Configure:** Create `backend/.env` from `.env.example` (Supabase + at least one AI key required). Follow the instructions inside `docker-compose.yml` to give Docker Desktop File Sharing permissions for your raw video folder on Windows (e.g. `D:\Auto_Clipper\vids`).
2. **Start the Stack:**
   ```bash
   docker-compose up -d --build
   ```
3. **Seed Admin:**
   ```bash
   docker exec -it autoclipper_backend python seed_admin.py admin@yourdomain.com your_password "Admin Name"
   ```
4. **Get your Public URL:**
   ```bash
   docker logs autoclipper_tunnel | findstr trycloudflare
   ```
   *Copy the secure `trycloudflare.com` URL to access your app from anywhere over the internet.*

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core Architecture** | Asynchronous Python 3.10+, FastAPI |
| **Data Persistence** | Supabase (PostgreSQL), SQLAlchemy ORM |
| **AI Inference** | Google Gemini / OpenAI (configurable via `AI_PROVIDER`) |
| **Media Processing** | FFmpeg (Zero-copy clipping), `faster-whisper` (CTranslate2) |
| **Frontend Runtime** | React 18, Vite, Framer Motion (Transitions) |
| **Analytics Engine** | Recharts (SVG hardware-accelerated rendering) |
| **Security** | JWT (PyJWT), bcrypt, Global Exception Sanitization |

## 📚 Documentation

| Document | Description |
|-------|-------------|
| [Architecture & Performance](ARCHITECTURE.md) | Deep dive into sub-linear clipping, AI rationale, and deployment scaling strategies (Local vs. Railway). |
| [Setup Guide](documentation/SETUP.md) | Detailed installation and Supabase configuration. |
| [API Reference](documentation/API.md) | REST API endpoints, JWT structure, and SSE implementation. |

## License

MIT
