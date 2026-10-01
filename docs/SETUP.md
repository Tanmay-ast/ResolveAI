# ResolveAI — Setup & Operation Guide

## 1. Prerequisites
- **Node.js**: Version 20.x or higher (tested on Node v24)
- **npm**: Version 10.x or higher (tested on npm v11)
- **Operating System**: Windows, macOS, or Linux (cross-platform compatible)
- **Cost / Accounts**: ₹0 required. No paid services, no subscriptions, no Ollama.

---

## 2. Quick Start (Zero-Cost Default)

Clone the repository and run:

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Start both Client and Server in development mode
npm run dev
```

The application will be accessible at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

---

## 3. Available NPM Scripts

From the repository root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both client and server concurrently in development mode |
| `npm run build` | Builds both client and server for production |
| `npm run typecheck` | Runs TypeScript type checking across client and server |
| `npm run lint` | Runs code linting |
| `npm run test` | Runs unit and integration test suites |
| `npm run clean` | Cleans build artifacts (`dist` directories) |

---

## 4. Environment Variables Reference

See `.env.example` for available configuration toggles:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3001` | Fastify backend server listening port |
| `CLIENT_PORT` | `5173` | Vite development server port |
| `AI_PROVIDER` | `local` | Active reasoning adapter (`local` or `gemini`) |
| `GEMINI_API_KEY` | *(empty)* | Optional free-tier Gemini API key if using `gemini` adapter |
| `SIMULATION_DELAY_MS` | `600` | Simulated step latency for realistic UI observability |

---

## 5. Verification Checklist

To verify the setup adheres to hackathon guidelines:
1. `npm run typecheck` exits with code 0.
2. `npm run build` generates production bundles for client and server.
3. Starting without a `.env` or with default values works with 100% offline local adapter.
