# ResolveAI — Implementation Roadmap & TODO

## Phase 1: Project Foundation & Verification Setup (Current)
- [x] Inspect project directory and verify environment capabilities (Node.js v24, npm v11).
- [x] Create project development rules (`AGENTS.md`).
- [x] Create architecture, decision records, setup, and state documentation (`docs/`).
- [x] Create root configuration, `.gitignore`, and `.env.example`.
- [x] Scaffold root `package.json` with npm workspaces (`client/`, `server/`).
- [x] Scaffold `server/` Fastify + TypeScript skeleton with health check endpoint.
- [x] Scaffold `client/` React + Vite + TypeScript skeleton.
- [x] Verify root scripts: `npm run typecheck`, `npm run build`, and server startup.

---

## Phase 2: Mock IT Data & Knowledge Base
- [ ] Build seed fixtures for IT Service Desk tickets:
  - Account lockout (Active Directory)
  - Expired VPN certificate (GlobalProtect/AnyConnect)
  - MDM compliance failure / disk encryption (Jamf/BitLocker)
  - Software request requiring approval (Docker / Figma)
  - Unsolvable hardware issue requiring physical replacement (Escalation demo)
- [ ] Build simulated system telemetry stores (Identity store, MDM store, Network gateway store).
- [ ] Build local markdown-based Knowledge Base articles & SOPs with search/retrieval engine.

---

## Phase 3: Fastify Backend & Agent Workflow Engine
- [ ] Implement `AgentReasoningAdapter` interface.
- [ ] Implement `LocalDeterministicAdapter` (zero-cost offline heuristic/pattern matching engine).
- [ ] Implement the 6 pipeline stages:
  1. `TriageStage` (classification, priority, urgency, sentiment)
  2. `RagKnowledgeStage` (article lookup, SOP excerpt retrieval, relevance scoring)
  3. `DiagnosisStage` (telemetry probe execution against mock systems)
  4. `TroubleshootingStage` (symptom & telemetry correlation, RCA, hypothesis)
  5. `ResolutionStage` (safe automated action execution or resolution recommendation)
  6. `EscalationStage` (human escalation packaging when criteria met)
- [ ] Implement Fastify API endpoints:
  - `GET /api/health`
  - `GET /api/tickets`
  - `POST /api/tickets`
  - `POST /api/tickets/:id/investigate` (runs the 6-stage agent workflow)
  - `POST /api/tickets/:id/resolve` (execute approved resolution)
  - `POST /api/tickets/:id/escalate` (confirm manual human escalation)
  - `GET /api/telemetry/:employeeEmail`
  - `GET /api/kb`

---

## Phase 4: React UI & Agent Observability Workbench
- [ ] Header with system status, active reasoning adapter badge, and zero-cost indicator.
- [ ] Ticket Intake & Preset Scenarios selector (instant test cases for demoing).
- [ ] Visual 6-Stage Agent Pipeline Tracker (active stage, status indicators, badges).
- [ ] Agent Reasoning & Evidence Inspector (tabs for citations, telemetry logs, RCA hypothesis).
- [ ] Autonomous Action & Escalation Box (one-click action verification, escalation handover).
- [ ] Simulated System Telemetry Live Inspector (Okta, Jamf, VPN status viewer).

---

## Phase 5: Verification, Polish & Demo Readiness
- [ ] Full end-to-end dry run of all 5 demo scenarios.
- [ ] Verify clean error handling and boundary testing.
- [ ] Run full typecheck and production build.
- [ ] Verify ₹0 cost claim and zero external dependency operation.
