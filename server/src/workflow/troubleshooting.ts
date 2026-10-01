import { Ticket, WorkflowStageResult, KnowledgeArticle } from '../types.js';

export interface TroubleshootingResult {
  stageResult: WorkflowStageResult;
  resolutionStrategy: 'EXECUTE_AUTOMATED_REMEDIATION' | 'ESCALATE_TO_HUMAN';
  rootCause: string;
  recommendedActionId?: string;
  recommendedActionName?: string;
}

export function executeTroubleshooting(
  ticket: Ticket,
  kbArticle: KnowledgeArticle | null,
  diagnosisResult: WorkflowStageResult
): TroubleshootingResult {
  let resolutionStrategy: 'EXECUTE_AUTOMATED_REMEDIATION' | 'ESCALATE_TO_HUMAN' = 'ESCALATE_TO_HUMAN';
  let rootCause = '';
  let decision = '';
  let rationale = '';
  let confidence = 95;
  let recommendedActionId: string | undefined;
  let recommendedActionName: string | undefined;

  switch (ticket.scenarioKey) {
    case 'dns_portal': {
      rootCause = 'Local DNS cache corruption returning NXDOMAIN (0.0.0.0) despite active Wi-Fi link.';
      resolutionStrategy = 'EXECUTE_AUTOMATED_REMEDIATION';
      recommendedActionId = 'ACT_FLUSH_DNS_RENEW_DHCP';
      recommendedActionName = 'Flush Local DNS Resolver Cache & Renew DHCP Lease';
      decision = 'Root cause confirmed as local resolver corruption. Safe automated remediation approved per KB-NET-01.';
      rationale = 'Diagnosis confirmed physical Wi-Fi connection and gateway are healthy. The failure is isolated to corrupted local DNS mappings. SOP KB-NET-01 authorizes automated cache flush with zero disruption risk.';
      confidence = 98;
      break;
    }

    case 'account_lock': {
      rootCause = 'Account lockout triggered by consecutive failed credential attempts exceeding threshold.';
      resolutionStrategy = 'EXECUTE_AUTOMATED_REMEDIATION';
      recommendedActionId = 'ACT_UNLOCK_IDENTITY_ACCOUNT';
      recommendedActionName = 'Unlock User Account in Identity Directory & Reset Lock Counter';
      decision = 'Account lockout confirmed with valid MFA status. Safe automated identity unlock approved per KB-SEC-04.';
      rationale = 'User MFA enrollment is healthy and device is compliant. Security policy KB-SEC-04 permits automated unlock and challenge generation for verified users.';
      confidence = 97;
      break;
    }

    case 'vpn_cert': {
      rootCause = 'Client machine X.509 cryptographic certificate expired on 2026-09-29.';
      resolutionStrategy = 'ESCALATE_TO_HUMAN';
      decision = 'Automated remediation prohibited by InfoSec Policy #SEC-882. Escalation required for SecOps manual CSR signing.';
      rationale = 'While the root cause is precisely known, issuing corporate VPN credentials requires Level 2 SecOps cryptographic key authorization. Autonomous bot cannot sign machine certificates.';
      confidence = 94;
      break;
    }

    case 'software_request': {
      rootCause = 'Commercial software license missing and elevated administrative privileges requested.';
      resolutionStrategy = 'ESCALATE_TO_HUMAN';
      decision = 'Policy boundary reached: Local administrator rights and commercial software seats require human manager sign-off.';
      rationale = 'Automated bot is strictly barred from granting permanent or temporary root/admin privileges per IT governance guidelines. Forwarding to Manager Approval Queue.';
      confidence = 96;
      break;
    }

    case 'hardware_failure': {
      rootCause = 'Catastrophic mechanical and sector breakdown of physical NVMe/SSD drive (S.M.A.R.T. failure).';
      resolutionStrategy = 'ESCALATE_TO_HUMAN';
      decision = 'Physical hardware emergency: Software remediation impossible. Emergency escalation to IT Depot for physical replacement.';
      rationale = 'Hardware telemetry confirms 4,812 bad sectors and failing controller. Running any automated software commands risks immediate complete data loss and physical drive seizure.';
      confidence = 99;
      break;
    }

    default: {
      rootCause = 'Unknown or anomalous system behavior.';
      resolutionStrategy = 'ESCALATE_TO_HUMAN';
      decision = 'Confidence below threshold for automated resolution. Escalating to Level 2 Engineering.';
      rationale = 'No verified automated runbook matched the incident parameters with sufficient certainty.';
      confidence = 65;
    }
  }

  const stageResult: WorkflowStageResult = {
    stage: 'troubleshooting',
    stageName: '4. Troubleshooting & Root Cause Analysis (RCA)',
    status: 'SUCCESS',
    evidence: [
      { label: 'Determined Root Cause', value: rootCause, source: 'Correlation Engine' },
      { label: 'Remediation Strategy', value: resolutionStrategy, source: 'Policy & Safety Evaluator' },
      { label: 'Authorized Action ID', value: recommendedActionId || 'N/A (Escalation Path)', source: 'Runbook Registry' },
      { label: 'Diagnosis Confirmation', value: diagnosisResult.decision, source: 'Telemetry Stage' }
    ],
    toolCalls: [
      {
        toolName: 'correlateTelemetryAndPolicy',
        input: { ticketId: ticket.id, scenarioKey: ticket.scenarioKey, kbArticleId: kbArticle?.id },
        output: { rootCause, resolutionStrategy, confidence },
        timestamp: new Date().toISOString()
      }
    ],
    decision,
    rationale,
    confidence
  };

  return {
    stageResult,
    resolutionStrategy,
    rootCause,
    recommendedActionId,
    recommendedActionName
  };
}
