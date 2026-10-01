import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { INITIAL_TICKETS, KNOWLEDGE_BASE, MOCK_TELEMETRY } from './data/mockData.js';
import { Ticket } from './types.js';
import { runAgentWorkflow } from './workflow/orchestrator.js';

dotenv.config();

// In-memory state
let tickets: Ticket[] = JSON.parse(JSON.stringify(INITIAL_TICKETS));

export function resetMockState() {
  tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  app.removeAllContentTypeParsers();
  app.addContentTypeParser('*', { parseAs: 'string' }, (req, body, done) => {
    if (!body || body.length === 0) {
      done(null, {});
      return;
    }
    try {
      const json = JSON.parse(body.toString());
      done(null, json);
    } catch {
      done(null, body);
    }
  });

  // 1. Health check endpoint
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'resolveai-backend',
      timestamp: new Date().toISOString(),
      aiProvider: process.env.AI_PROVIDER || 'local',
      version: '1.0.0'
    };
  });

  // 2. Get all tickets
  app.get('/api/tickets', async () => {
    return {
      success: true,
      count: tickets.length,
      tickets
    };
  });

  // 3. Get all KB articles
  app.get('/api/kb', async () => {
    return {
      success: true,
      count: KNOWLEDGE_BASE.length,
      articles: KNOWLEDGE_BASE
    };
  });

  // 4. Get telemetry by employee email
  app.get<{ Params: { employeeEmail: string } }>('/api/telemetry/:employeeEmail', async (request, reply) => {
    const { employeeEmail } = request.params;
    const telemetry = MOCK_TELEMETRY[employeeEmail];
    if (!telemetry) {
      return reply.code(404).send({ error: 'Telemetry not found for specified employee' });
    }
    return {
      success: true,
      employeeEmail,
      telemetry
    };
  });

  // 5. Create new ticket
  app.post<{
    Body: {
      title: string;
      description: string;
      employeeEmail: string;
      employeeName?: string;
      department?: string;
    };
  }>('/api/tickets', async (request, reply) => {
    const { title, description, employeeEmail, employeeName, department } = request.body || {};
    if (!title || !description || !employeeEmail) {
      return reply.code(400).send({ error: 'title, description, and employeeEmail are required' });
    }

    const descLower = `${title} ${description}`.toLowerCase();
    let scenarioKey: Ticket['scenarioKey'] = 'dns_portal';
    if (descLower.includes('lock') || descLower.includes('password') || descLower.includes('sso')) {
      scenarioKey = 'account_lock';
    } else if (descLower.includes('vpn') || descLower.includes('cert')) {
      scenarioKey = 'vpn_cert';
    } else if (descLower.includes('docker') || descLower.includes('admin') || descLower.includes('privilege')) {
      scenarioKey = 'software_request';
    } else if (descLower.includes('hardware') || descLower.includes('smart') || descLower.includes('grind') || descLower.includes('screen')) {
      scenarioKey = 'hardware_failure';
    }

    const newTicket: Ticket = {
      id: `TCK-${1000 + tickets.length + 1}`,
      title,
      description,
      employeeEmail,
      employeeName: employeeName || employeeEmail.split('@')[0].replace('.', ' '),
      department: department || 'General Corporate',
      category: 'Unclassified',
      priority: 'P2',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      scenarioKey
    };

    tickets.unshift(newTicket);
    return reply.code(201).send({ success: true, ticket: newTicket });
  });

  // 6. Investigate ticket through the 6-stage agent workflow
  app.post<{ Params: { id: string } }>('/api/tickets/:id/investigate', async (request, reply) => {
    const { id } = request.params;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      return reply.code(404).send({ error: `Ticket ${id} not found` });
    }

    ticket.status = 'INVESTIGATING';
    const result = runAgentWorkflow(ticket);

    return {
      success: true,
      ticket,
      result
    };
  });

  // 7. Manually resolve ticket
  app.post<{ Params: { id: string } }>('/api/tickets/:id/resolve', async (request, reply) => {
    const { id } = request.params;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      return reply.code(404).send({ error: `Ticket ${id} not found` });
    }

    ticket.status = 'RESOLVED';
    return {
      success: true,
      ticket
    };
  });

  // 8. Manually escalate ticket
  app.post<{ Params: { id: string } }>('/api/tickets/:id/escalate', async (request, reply) => {
    const { id } = request.params;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      return reply.code(404).send({ error: `Ticket ${id} not found` });
    }

    ticket.status = 'ESCALATED';
    return {
      success: true,
      ticket
    };
  });

  // Reset demo state helper
  app.post('/api/reset', async () => {
    resetMockState();
    return { success: true, message: 'Demo tickets reset to initial state' };
  });

  return app;
}
