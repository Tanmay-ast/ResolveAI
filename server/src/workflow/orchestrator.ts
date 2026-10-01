import { Ticket, InvestigationResult, WorkflowStageResult } from '../types.js';
import { executeTriage } from './triage.js';
import { executeKnowledgeRetrieval } from './knowledge.js';
import { executeDiagnosis } from './diagnosis.js';
import { executeTroubleshooting } from './troubleshooting.js';
import { executeResolution } from './resolution.js';
import { executeEscalation } from './escalation.js';

export function runAgentWorkflow(ticket: Ticket): InvestigationResult {
  const stages: WorkflowStageResult[] = [];

  // Stage 1: Ticket Triage
  const triageResult = executeTriage(ticket);
  stages.push(triageResult);

  // Stage 2: Knowledge / RAG
  const { stageResult: ragResult, matchedArticle } = executeKnowledgeRetrieval(ticket, triageResult);
  stages.push(ragResult);

  // Stage 3: System Diagnosis
  const { stageResult: diagnosisResult } = executeDiagnosis(ticket, triageResult);
  stages.push(diagnosisResult);

  // Stage 4: Troubleshooting & RCA
  const troubleshootResult = executeTroubleshooting(ticket, matchedArticle, diagnosisResult);
  stages.push(troubleshootResult.stageResult);

  // Stage 5: Resolution
  const { stageResult: resolutionResult, remediation } = executeResolution(ticket, troubleshootResult);
  stages.push(resolutionResult);

  // Stage 6: Escalation
  const resolutionPassed = remediation?.verificationPassed ?? false;
  const { stageResult: escalationResult, dossier } = executeEscalation(ticket, troubleshootResult, resolutionPassed);
  stages.push(escalationResult);

  // Determine overall outcome
  const outcome: 'RESOLVED' | 'ESCALATED' = resolutionPassed ? 'RESOLVED' : 'ESCALATED';

  let finalDecision = '';
  let finalRationale = '';

  if (outcome === 'RESOLVED') {
    finalDecision = `Autonomous Resolution Verified: ${remediation?.actionName}.`;
    finalRationale = `Incident diagnosed, mitigated via approved automated runbook, and verified restored via post-action health probes with zero human intervention.`;
  } else {
    finalDecision = `Escalated to ${dossier?.assignedQueue}: ${dossier?.escalationReason}.`;
    finalRationale = `Automated remediation bypassed or restricted per security policy. Complete diagnostic evidence packaged for human engineer review.`;
  }

  const confidence = Math.round(
    stages.reduce((acc, s) => acc + s.confidence, 0) / stages.length
  );

  const result: InvestigationResult = {
    ticketId: ticket.id,
    outcome,
    stages,
    finalDecision,
    finalRationale,
    confidence,
    remediationAction: remediation,
    escalationDossier: dossier,
    completedAt: new Date().toISOString()
  };

  // Update in-memory ticket
  ticket.status = outcome;
  ticket.investigationResult = result;

  return result;
}
