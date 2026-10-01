# ResolveAI — Agent Development & Verification Rules

## Project Identity & Mission
**ResolveAI** is an autonomous IT Service Desk resolution agent built for the AI Agent Challenge (Problem Statement #12). It autonomously investigates employee IT tickets, analyzes knowledge bases, diagnoses system telemetry, applies troubleshooting procedures, safely executes or recommends resolutions, and escalates to human engineers when confidence or policy boundaries require it.

---

## 1. Core Operating Constraints
1. **₹0 Budget Strict Guarantee**:
   - Zero required paid APIs, zero subscriptions, zero paid tools.
   - Do NOT require Ollama or local LLM runtimes that require heavy GPU setups.
   - Must run completely offline with built-in heuristic/deterministic adapters and local mock datasets by default.
   - External LLMs (e.g., Google Gemini free tier) must be pluggable via an adapter, but the system must never break if no API key is provided.

2. **Portability & Neutrality**:
   - Must run cleanly on any standard machine via standard `npm install` and `npm run dev`.
   - Never depend on Antigravity, VS Code, Lovable, Stitch, or any proprietary IDE/agent tooling.
   - No absolute filesystem paths in any codebase file or configuration.
   - No secrets, tokens, or credentials committed to Git. `.env.example` serves as the sole environment template.

3. **Democratized Agentic Architecture (No Fake Chatbots)**:
   - Do NOT build a single chatbot prompt that hallucinates answers in one shot.
   - The agent MUST execute the 6 distinct, demonstrable workflow phases:
     `Ticket Triage` → `Knowledge/RAG` → `System Diagnosis` → `Troubleshooting` → `Resolution` → `Escalation`
   - Every agent step must emit structured telemetry: phase status, evidence gathered, reasoning step, confidence score, and decision payload.
   - The UI must visibly expose the agent workflow graph, timeline, and supporting evidence.
   - Human escalation must be a first-class outcome with human-in-the-loop approval triggers.

4. **Lean & Monolithic (No Microservices Over-Engineering)**:
   - Frontend: React + TypeScript + Vite.
   - Backend: Node.js + Fastify (lightweight, typed, fast).
   - Structured as a clean monorepo with `client/` and `server/` managed via npm workspaces.

---

## 2. Rigorous Verification & Completion Rules

> **CRITICAL RULE**: Never claim that a task is complete merely because code was written or generated.

For **every** implementation task, the agent must adhere to this exact sequence:
1. **Inspect existing code first**: Understand the surrounding context, types, and dependencies before making edits.
2. **Make the smallest safe change**: Keep commits atomic and focused.
3. **Preserve working functionality**: Never break existing passes or routes.
4. **Run Typecheck**: `npm run typecheck` across both client and server.
5. **Run Lint** (if configured): `npm run lint`.
6. **Run Tests** (if configured): `npm run test`.
7. **Run Production Build**: `npm run build` must succeed without warnings or errors.
8. **Verify Runtime Startup**: Verify that the application boots up properly and responds to health endpoints.
9. **Verify Feature Reachability**: Validate that the new UI component or backend endpoint is reachable and produces expected outputs.
10. **Report with Candor**:
    - Files created / modified
    - Commands run
    - Results and logs
    - Anything **NOT VERIFIED** (explicitly list edge cases or unverified states)
    - Exact next recommended implementation step

**Never claim success if any check fails.**
