import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp, resetMockState } from './app.js';
import { runAgentWorkflow } from './workflow/orchestrator.js';
import { INITIAL_TICKETS } from './data/mockData.js';
import { Ticket } from './types.js';

describe('ResolveAI End-to-End Suite', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('Health & Metadata Endpoints', () => {
    test('GET /api/health returns status ok with metadata', async () => {
      const app = await buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/health' });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.status, 'ok');
      assert.equal(body.service, 'resolveai-backend');
      assert.equal(body.aiProvider, 'local');
      await app.close();
    });

    test('GET /api/tickets returns initial tickets', async () => {
      const app = await buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/tickets' });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.success, true);
      assert.equal(body.count, 5);
      assert.equal(body.tickets[0].id, 'TCK-1001');
      await app.close();
    });

    test('GET /api/kb returns local knowledge base SOPs', async () => {
      const app = await buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/kb' });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.success, true);
      assert.equal(body.count, 5);
      assert.equal(body.articles[0].id, 'KB-NET-01');
      await app.close();
    });

    test('GET /api/telemetry/:employeeEmail returns telemetry data', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'GET',
        url: '/api/telemetry/sarah.chen@acme-corp.internal'
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.success, true);
      assert.equal(body.telemetry.network.gatewayStatus, 'ONLINE');
      assert.equal(body.telemetry.network.dnsResolution, 'FAILING');
      await app.close();
    });
  });

  describe('Workflow Stage Ordering & Integrity', () => {
    test('Workflow strictly executes all 6 stages in required order', () => {
      const ticket: Ticket = JSON.parse(JSON.stringify(INITIAL_TICKETS[0]));
      const result = runAgentWorkflow(ticket);

      const expectedStages = ['triage', 'rag', 'diagnosis', 'troubleshooting', 'resolution', 'escalation'];
      assert.equal(result.stages.length, 6);
      result.stages.forEach((stage, idx) => {
        assert.equal(stage.stage, expectedStages[idx], `Stage at index ${idx} must be ${expectedStages[idx]}`);
        assert.ok(stage.confidence > 0, 'Stage confidence must be greater than 0');
        assert.ok(stage.decision.length > 0, 'Stage decision must not be empty');
        assert.ok(stage.rationale.length > 0, 'Stage rationale must not be empty');
      });
    });
  });

  describe('Autonomous Resolution Branching', () => {
    test('Scenario 1: Wi-Fi portal DNS issue executes automated DNS flush and resolves', () => {
      const ticket: Ticket = JSON.parse(JSON.stringify(INITIAL_TICKETS[0]));
      assert.equal(ticket.id, 'TCK-1001');

      const result = runAgentWorkflow(ticket);

      // Verify overall outcome
      assert.equal(result.outcome, 'RESOLVED');
      assert.equal(ticket.status, 'RESOLVED');

      // Verify Stage 1: Triage
      const triage = result.stages[0];
      assert.equal(triage.stage, 'triage');
      assert.ok(triage.decision.includes('Network & Access'));

      // Verify Stage 2: Knowledge RAG
      const rag = result.stages[1];
      assert.equal(rag.stage, 'rag');
      assert.ok(rag.decision.includes('KB-NET-01'));

      // Verify Stage 3: Diagnosis
      const diagnosis = result.stages[2];
      assert.equal(diagnosis.stage, 'diagnosis');
      assert.ok(diagnosis.decision.includes('DNS resolver corruption'));
      const dnsEvidence = diagnosis.evidence.find(e => e.label === 'Portal Host Lookup');
      assert.ok(dnsEvidence);

      // Verify Stage 4: Troubleshooting
      const troubleshoot = result.stages[3];
      assert.equal(troubleshoot.stage, 'troubleshooting');
      assert.ok(troubleshoot.decision.includes('Safe automated remediation approved'));

      // Verify Stage 5: Resolution
      const resolution = result.stages[4];
      assert.equal(resolution.stage, 'resolution');
      assert.equal(resolution.status, 'SUCCESS');
      assert.ok(result.remediationAction);
      assert.equal(result.remediationAction.actionId, 'ACT_FLUSH_DNS_RENEW_DHCP');
      assert.equal(result.remediationAction.verificationPassed, true);

      // Verify Stage 6: Escalation bypassed
      const escalation = result.stages[5];
      assert.equal(escalation.stage, 'escalation');
      assert.equal(escalation.status, 'SKIPPED');
      assert.equal(result.escalationDossier, undefined);
    });

    test('Scenario 2: Account locked executes automated unlock and resolves', () => {
      const ticket: Ticket = JSON.parse(JSON.stringify(INITIAL_TICKETS[1]));
      assert.equal(ticket.id, 'TCK-1002');

      const result = runAgentWorkflow(ticket);
      assert.equal(result.outcome, 'RESOLVED');
      assert.ok(result.remediationAction);
      assert.equal(result.remediationAction.actionId, 'ACT_UNLOCK_IDENTITY_ACCOUNT');
      assert.equal(result.remediationAction.verificationPassed, true);
    });
  });

  describe('Human Escalation Branching', () => {
    test('Scenario 3: Expired VPN certificate escalates to SecOps per policy', () => {
      const ticket: Ticket = JSON.parse(JSON.stringify(INITIAL_TICKETS[2]));
      assert.equal(ticket.id, 'TCK-1003');

      const result = runAgentWorkflow(ticket);

      // Verify overall outcome
      assert.equal(result.outcome, 'ESCALATED');
      assert.equal(ticket.status, 'ESCALATED');

      // Verify Stage 5 was skipped
      const resolution = result.stages[4];
      assert.equal(resolution.stage, 'resolution');
      assert.equal(resolution.status, 'SKIPPED');

      // Verify Stage 6 produced escalation dossier
      const escalation = result.stages[5];
      assert.equal(escalation.stage, 'escalation');
      assert.equal(escalation.status, 'SUCCESS');
      assert.ok(result.escalationDossier);
      assert.equal(result.escalationDossier.assignedQueue, 'Level 2 SecOps & Network Operations');
      assert.equal(result.escalationDossier.urgencyLevel, 'P2');
      assert.ok(result.escalationDossier.recommendedHumanAction.includes('mTLS machine certificate'));
    });

    test('Scenario 5: S.M.A.R.T. physical hardware failure triggers emergency P1 escalation', () => {
      const ticket: Ticket = JSON.parse(JSON.stringify(INITIAL_TICKETS[4]));
      assert.equal(ticket.id, 'TCK-1005');

      const result = runAgentWorkflow(ticket);

      assert.equal(result.outcome, 'ESCALATED');
      assert.equal(ticket.status, 'ESCALATED');
      assert.ok(result.escalationDossier);
      assert.equal(result.escalationDossier.urgencyLevel, 'P1');
      assert.ok(result.escalationDossier.assignedQueue.includes('IT Hardware Depot'));
      assert.ok(result.escalationDossier.diagnosticFindings.includes('CRITICAL_FAILURE'));
    });
  });

  describe('API Investigation Route', () => {
    test('POST /api/tickets/:id/investigate executes end-to-end investigation and returns result', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/tickets/TCK-1001/investigate'
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.success, true);
      assert.equal(body.ticket.id, 'TCK-1001');
      assert.equal(body.result.outcome, 'RESOLVED');
      assert.equal(body.result.stages.length, 6);
      assert.ok(body.result.stages[0].toolCalls.length > 0);
      assert.ok(body.result.stages[2].evidence.length > 0);

      await app.close();
    });

    test('POST /api/tickets/:id/investigate returns 404 for nonexistent ticket', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/tickets/TCK-9999/investigate'
      });

      assert.equal(res.statusCode, 404);
      await app.close();
    });
  });
});
