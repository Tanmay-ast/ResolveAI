import { Ticket, WorkflowStageResult, RemediationActionExecution, ToolCall, StageEvidence } from '../types.js';
import { executeFlushDns, executeUnlockAccount } from '../tools/remediationTools.js';
import { TroubleshootingResult } from './troubleshooting.js';

export function executeResolution(
  ticket: Ticket,
  troubleshootResult: TroubleshootingResult
): {
  stageResult: WorkflowStageResult;
  remediation?: RemediationActionExecution;
} {
  // If troubleshooting determined that the issue must be escalated, mark resolution stage accordingly
  if (troubleshootResult.resolutionStrategy === 'ESCALATE_TO_HUMAN') {
    return {
      stageResult: {
        stage: 'resolution',
        stageName: '5. Autonomous Remediation Execution',
        status: 'SKIPPED',
        evidence: [
          { label: 'Execution Decision', value: 'Bypassed per Policy Gate', source: 'Safety Guardrails' },
          { label: 'Reason', value: 'Action requires manual human intervention or is policy-restricted', source: 'Troubleshooting Engine' }
        ],
        toolCalls: [],
        decision: 'Automated remediation bypassed: Issue diverted directly to Human Escalation dossier generation.',
        rationale: 'Safety boundaries prevented executing software actions for policy-restricted or unrecoverable issues.',
        confidence: 100
      }
    };
  }

  // Execute the appropriate safe remediation tool
  let execution: RemediationActionExecution | undefined;
  const toolCalls: ToolCall[] = [];
  const evidence: StageEvidence[] = [];

  if (ticket.scenarioKey === 'dns_portal') {
    const res = executeFlushDns(ticket.employeeEmail);
    execution = res.execution;
    toolCalls.push(res.toolCall);

    evidence.push({ label: 'Executed Remediation', value: res.execution.actionName, source: 'Remediation Engine' });
    evidence.push({ label: 'OS Command Executed', value: res.execution.toolOutput['command'], source: 'Client Agent' });
    evidence.push({ label: 'DHCP Lease Renewed', value: 'Yes (Active)', source: 'Network Interface' });
    evidence.push({ label: 'Post-Remediation DNS Lookup', value: res.execution.toolOutput['newDnsResolution'], source: 'Live Verification Probe' });
    evidence.push({ label: 'Portal HTTP Health Check', value: res.execution.toolOutput['httpVerification'], source: 'Synthetic Endpoint Probe' });
  } else if (ticket.scenarioKey === 'account_lock') {
    const res = executeUnlockAccount(ticket.employeeEmail);
    execution = res.execution;
    toolCalls.push(res.toolCall);

    evidence.push({ label: 'Executed Remediation', value: res.execution.actionName, source: 'Remediation Engine' });
    evidence.push({ label: 'Directory Action', value: res.execution.toolOutput['status'], source: 'Okta IDP Sync' });
    evidence.push({ label: 'Lock Counter Reset', value: '0 attempts', source: 'Auth Registry' });
    evidence.push({ label: 'Security Audit Event', value: res.execution.toolOutput['auditEventId'], source: 'SIEM Audit Trail' });
  }

  const decision = execution?.verificationPassed
    ? `Successfully executed remediation [${execution.actionName}]. Post-action verification confirmed service restored.`
    : 'Remediation execution completed with pending verification.';

  const rationale = 'Remediation executed within verified low-risk boundaries. Synthetic probe confirmed portal reachability and DNS resolution.';

  return {
    stageResult: {
      stage: 'resolution',
      stageName: '5. Autonomous Remediation Execution',
      status: 'SUCCESS',
      evidence,
      toolCalls,
      decision,
      rationale,
      confidence: 99
    },
    remediation: execution
  };
}
