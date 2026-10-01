import { Ticket, WorkflowStageResult, EscalationDossier, ToolCall, StageEvidence } from '../types.js';
import { TroubleshootingResult } from './troubleshooting.js';

export function executeEscalation(
  ticket: Ticket,
  troubleshootResult: TroubleshootingResult,
  resolutionPassed: boolean
): {
  stageResult: WorkflowStageResult;
  dossier?: EscalationDossier;
} {
  // If resolution succeeded autonomously, escalation is not needed
  if (troubleshootResult.resolutionStrategy === 'EXECUTE_AUTOMATED_REMEDIATION' && resolutionPassed) {
    return {
      stageResult: {
        stage: 'escalation',
        stageName: '6. Human Escalation & Dossier Packaging',
        status: 'SKIPPED',
        evidence: [
          { label: 'Escalation Status', value: 'Not Required', source: 'Autonomous Resolution Gate' },
          { label: 'Autonomous Verification', value: '100% Passed', source: 'Post-Remediation Probes' }
        ],
        toolCalls: [],
        decision: 'No human escalation required. Incident fully resolved autonomously within safety boundaries.',
        rationale: 'Root cause was safely mitigated and verified without human intervention.',
        confidence: 100
      }
    };
  }

  // Build the structured human escalation dossier
  let dossier: EscalationDossier;

  switch (ticket.scenarioKey) {
    case 'vpn_cert':
      dossier = {
        escalationReason: 'Machine VPN certificate expired (Requires Cryptographic CSR Signing)',
        urgencyLevel: 'P2',
        assignedQueue: 'Level 2 SecOps & Network Operations',
        symptomsSummary: `Employee ${ticket.employeeName} unable to establish GlobalProtect VPN tunnel due to certificate expiration.`,
        diagnosticFindings: 'GlobalProtect gateway logs confirmed error SEC_ERR_CERT_EXPIRED on certificate thumbprint ACME-CA-884.',
        recommendedHumanAction: 'Review employee identity, generate updated mTLS machine certificate, and sign via internal PKI authority.'
      };
      break;

    case 'software_request':
      dossier = {
        escalationReason: 'Administrative Privilege Request & Paid Software Seat Allocation (Docker Desktop)',
        urgencyLevel: 'P3',
        assignedQueue: 'IT Governance & Team Lead Approval Queue',
        symptomsSummary: `Employee ${ticket.employeeName} requested local administrator rights to install Docker Desktop Enterprise.`,
        diagnosticFindings: 'Endpoint MDM shows standard corporate role. License pool requires manager cost center sign-off.',
        recommendedHumanAction: 'Verify project onboarding requirement with department manager and dispatch managed self-service installer pkg.'
      };
      break;

    case 'hardware_failure':
      dossier = {
        escalationReason: 'Imminent Physical Storage Drive Crash (S.M.A.R.T. Fatal Alert & Mechanical Clicking)',
        urgencyLevel: 'P1',
        assignedQueue: 'IT Hardware Depot & Field Support (Urgent Dispatch)',
        symptomsSummary: `Employee ${ticket.employeeName} reports clicking sounds, violent flickering, and BIOS S.M.A.R.T. fatal alert.`,
        diagnosticFindings: 'MDM hardware sensor logs: S.M.A.R.T. status CRITICAL_FAILURE, 4,812 bad sectors, thermal overheat.',
        recommendedHumanAction: 'Immediately issue hot-swap loaner laptop, advise user not to power cycle failing drive, and schedule physical drive recovery.'
      };
      break;

    default:
      dossier = {
        escalationReason: 'Low diagnostic confidence or unsupported automated runbook',
        urgencyLevel: ticket.priority,
        assignedQueue: 'Level 2 General IT Service Desk',
        symptomsSummary: ticket.description,
        diagnosticFindings: troubleshootResult.rootCause,
        recommendedHumanAction: 'Review diagnostic logs and conduct manual screen-share troubleshooting.'
      };
      break;
  }

  const toolCalls: ToolCall[] = [
    {
      toolName: 'generateHumanEscalationDossier',
      input: { ticketId: ticket.id, scenarioKey: ticket.scenarioKey, reason: dossier.escalationReason },
      output: { ...dossier },
      timestamp: new Date().toISOString()
    }
  ];

  const evidence: StageEvidence[] = [
    { label: 'Target Engineering Queue', value: dossier.assignedQueue, source: 'Routing Dispatcher' },
    { label: 'Assigned Urgency Level', value: dossier.urgencyLevel, source: 'SLA Escalation Matrix' },
    { label: 'Escalation Justification', value: dossier.escalationReason, source: 'Policy Engine' },
    { label: 'Recommended Human Action', value: dossier.recommendedHumanAction, source: 'Diagnostic Synthesizer' }
  ];

  return {
    stageResult: {
      stage: 'escalation',
      stageName: '6. Human Escalation & Dossier Packaging',
      status: 'SUCCESS',
      evidence,
      toolCalls,
      decision: `Packaged complete diagnostic dossier and routed to [${dossier.assignedQueue}] at [${dossier.urgencyLevel}] urgency.`,
      rationale: `Escalation triggered because: ${dossier.escalationReason}. Human engineers receive full telemetry context to prevent repeated questioning.`,
      confidence: 98
    },
    dossier
  };
}
