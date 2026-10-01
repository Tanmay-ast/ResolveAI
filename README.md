# ResolveAI — Autonomous IT Service Desk Resolution Agent

> Built for the **AI Agent Challenge** — Problem Statement #12: *AI IT Service Desk Autonomous Resolution Agent*.

ResolveAI is an observable, agentic IT service-desk application that receives employee IT issues, investigates them autonomously through 6 distinct stages, leverages a local knowledge base and simulated enterprise telemetry, and executes safe remediation or escalates to human engineers.

---

## 🎯 Required Agent Workflow

ResolveAI explicitly implements the full 6-phase resolution cycle:

```
Ticket Triage ──▶ Knowledge/RAG ──▶ System Diagnosis ──▶ Troubleshooting ──▶ Resolution ──▶ Escalation
```

1. **Ticket Triage**: Classifies category, priority level (P1-P4), urgency, and sentiment.
2. **Knowledge/RAG**: Searches standard operating procedures and KB articles for remediation guides.
3. **System Diagnosis**: Probes simulated enterprise systems (Identity/Okta, MDM/Jamf, VPN Gateways).
4. **Troubleshooting**: Correlates symptoms and telemetry to form a diagnostic hypothesis with confidence scoring.
5. **Resolution**: Executes or prescribes safe automated remediation (account unlock, cache flush, cert guidance).
6. **Escalation**: Packages detailed diagnostic dossiers for human L2/L3 engineers when automation is unsafe or confidence is low.

---

## 💡 Key Highlights & Strict Constraints Met

- **₹0 Cost Guarantee**: Zero paid APIs, zero subscriptions, zero paid services required.
- **No Ollama Required**: Runs out of the box on standard Node.js without requiring heavy local LLM runtimes or GPUs.
- **100% Portable**: Works anywhere with standard Node.js and standard browsers. No dependency on Antigravity, VS Code, Lovable, Stitch, or any proprietary platform.
- **Replaceable AI Adapter**: Uses a built-in heuristic/pattern reasoning adapter by default; pluggable free-tier API adapters (e.g., Gemini Free API) can be slotted in with zero core logic changes.
- **Visible Agent Reasoning & Evidence**: The UI displays live step progression, intermediate reasoning, tool citations, and telemetry evidence.
- **Human-in-the-Loop Escalation**: Built-in escalation trigger ensuring safe boundaries and clear audit trails.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (Node v24 tested)
- npm 10+ (npm v11 tested)

### 1. Installation
```bash
git clone <repo-url>
cd antigravity
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```
*(No API keys are required to run the full application with the default offline adapter).*

### 3. Run Development Servers
```bash
npm run dev
```

Visit:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

---

## 🧪 Verification Commands

```bash
# Typecheck both client and server
npm run typecheck

# Production build both client and server
npm run build
```

---

## 📁 Repository Structure

```
antigravity/
├── client/              # React 18 + Vite + TypeScript frontend
│   ├── src/             # Components, agent visualizer, evidence panels
│   └── package.json
├── server/              # Node.js + Fastify + TypeScript backend
│   ├── src/             # Agent pipeline, adapters, mock telemetry stores
│   └── package.json
├── docs/                # Architectural records, setup guides, and project state
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── PROJECT_STATE.md
│   ├── SETUP.md
│   └── TODO.md
├── AGENTS.md            # Agent development and verification rules
├── .env.example         # Environment template (no secrets committed)
├── package.json         # Monorepo root with npm workspaces
└── README.md            # Project overview
```
