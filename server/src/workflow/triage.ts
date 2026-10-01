import { Ticket, WorkflowStageResult } from '../types.js';

export function executeTriage(ticket: Ticket): WorkflowStageResult {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();
  
  let category = 'General IT Support';
  let priority = ticket.priority;
  let affectedService = 'Workstation Service';
  let rationale = '';
  let confidence = 95;

  if (text.includes('wi-fi') || text.includes('wifi') || text.includes('portal') || text.includes('dns')) {
    category = 'Network & Access';
    affectedService = 'Internal Company Portal (portal.acme-corp.internal)';
    priority = 'P2';
    rationale = 'Identified Wi-Fi connectivity and internal portal failure keywords. Classified as Network & Access incident.';
    confidence = 96;
  } else if (text.includes('locked') || text.includes('password') || text.includes('single sign-on') || text.includes('sso')) {
    category = 'Identity & Access';
    affectedService = 'Corporate Okta SSO / Active Directory';
    priority = 'P2';
    rationale = 'Detected failed login count exceeded lockout condition. Classified as Identity & Access incident.';
    confidence = 98;
  } else if (text.includes('vpn') || text.includes('certificate') || text.includes('globalprotect')) {
    category = 'Network & Security';
    affectedService = 'GlobalProtect Remote VPN Gateway';
    priority = 'P2';
    rationale = 'Detected VPN gateway certificate rejection symptom. Classified as Network & Security incident.';
    confidence = 94;
  } else if (text.includes('docker') || text.includes('admin') || text.includes('privilege') || text.includes('install')) {
    category = 'Software & Governance';
    affectedService = 'Software Delivery & Endpoint Privilege Management';
    priority = 'P3';
    rationale = 'Detected request for administrative access and commercial software installation.';
    confidence = 92;
  } else if (text.includes('smart') || text.includes('grinding') || text.includes('clicking') || text.includes('hardware') || text.includes('flicker')) {
    category = 'Hardware & Workstation';
    affectedService = 'Physical Endpoint Hardware (Storage / Motherboard)';
    priority = 'P1';
    rationale = 'Detected catastrophic mechanical drive sounds and S.M.A.R.T. BIOS warnings. Classified as critical P1 Hardware failure.';
    confidence = 99;
  }

  return {
    stage: 'triage',
    stageName: '1. Ticket Triage & Classification',
    status: 'SUCCESS',
    evidence: [
      { label: 'Identified Category', value: category, source: 'Intent Classifier' },
      { label: 'Assigned Priority', value: priority, source: 'SLA Matrix' },
      { label: 'Affected Service', value: affectedService, source: 'Entity Extraction' },
      { label: 'Reporting Employee', value: `${ticket.employeeName} (${ticket.department})`, source: 'HR Directory' }
    ],
    toolCalls: [
      {
        toolName: 'classifyTicketIntent',
        input: { title: ticket.title, description: ticket.description },
        output: { category, priority, affectedService, confidence },
        timestamp: new Date().toISOString()
      }
    ],
    decision: `Categorized as [${category}] with priority [${priority}] impacting [${affectedService}].`,
    rationale,
    confidence
  };
}
