# ResolveAI — Architecture Decision Records (ADRs)

## ADR 001: Monorepo Structure with npm Workspaces
- **Date**: 2026-10-01
- **Context**: The project requires both a responsive visual frontend (React + Vite) and an agent workflow backend (Fastify).
- **Decision**: Organize the repository as a clean monorepo with `client/` and `server/` managed by root npm workspaces.
- **Consequences**: Single `npm install` installs all dependencies; shared scripts (`npm run build`, `npm run typecheck`) can verify the entire project in one step. Keeps dependencies portable and eliminates complex build tools like Turbo or Nx.

---

## ADR 002: Zero-Cost Offline-First Default with Replaceable Reasoning Adapter
- **Date**: 2026-10-01
- **Context**: Challenge rules demand ₹0 cost, no paid APIs, no subscriptions, no Ollama requirement, and independence from proprietary platforms.
- **Decision**: Implement a clean `AgentReasoningAdapter` interface. The primary and default implementation is `LocalDeterministicAdapter`, which uses heuristic analysis, pattern matching, symptom correlation, and local KB indexing. An optional `GeminiFreeAdapter` can be plugged in when `AI_PROVIDER=gemini` and a free-tier API key is configured.
- **Consequences**: The application runs completely out-of-the-box with zero configuration and zero cost. Any evaluator can clone and run it immediately without signing up for API keys or installing heavy local LLMs.

---

## ADR 003: Explicit 6-Stage Agent Pipeline over Single-Prompt Chatbot
- **Date**: 2026-10-01
- **Context**: Hackathon problem statement requires demonstrable agentic behavior across Ticket Triage, Knowledge/RAG, System Diagnosis, Troubleshooting, Resolution, and Escalation.
- **Decision**: Avoid monolithic chatbot prompts. The agent is built as a sequential state machine where each stage receives typed inputs and produces typed outputs with verified evidence and confidence scores.
- **Consequences**: Every decision step can be audited, visualized in the UI, and programmatically tested. Human-in-the-loop escalation is an organic branch of the pipeline rather than an afterthought.

---

## ADR 004: In-Memory Simulated Telemetry Stores with Preloaded Scenarios
- **Date**: 2026-10-01
- **Context**: An enterprise IT desk relies on external data sources (Okta/Active Directory, Jamf MDM, VPN gateways, ServiceNow/Jira). Demanding real enterprise integrations or external databases breaks portability and zero-cost setup.
- **Decision**: Create realistic in-memory data stores populated with standard employee personas, device compliance states, network connection logs, and IT tickets representing common corporate IT issues (e.g. locked account, expired VPN certificate, disk encryption compliance failure, unauthorized software installation request).
- **Consequences**: Instant startup, reproducible test runs, rich demo scenarios, and zero external infrastructure requirements.

---

## ADR 005: Fastify for the Backend API
- **Date**: 2026-10-01
- **Context**: Need a fast, lightweight Node.js API with first-class TypeScript support and low overhead.
- **Decision**: Use Fastify instead of Express or heavy frameworks like NestJS.
- **Consequences**: Fast startup, built-in schema validation, excellent TypeScript developer experience, and minimal footprint.

---

## ADR 006: Transparent Agent Observability UI with Live Step Execution
- **Date**: 2026-10-01
- **Context**: Judges and evaluators need to see agent reasoning, evidence citations, and confidence levels in real time to differentiate from generic chatbots.
- **Decision**: Design the UI with a split workbench view: left side contains the ticket intake and simulated system telemetry inspector; center/right side displays the live 6-stage workflow graph, step-by-step reasoning log, evidence inspector, and human escalation handoff panel.
- **Consequences**: Clear, impactful visual demonstration of true agentic investigation.
