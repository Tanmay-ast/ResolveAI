export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';

export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: string;
}

export interface StageEvidence {
  label: string;
  value: unknown;
  source: string;
}

export interface WorkflowStageResult {
  stage: 'triage' | 'rag' | 'diagnosis' | 'troubleshooting' | 'resolution' | 'escalation';
  stageName: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  evidence: StageEvidence[];
  toolCalls: ToolCall[];
  decision: string;
  rationale: string;
  confidence: number;
}

export interface RemediationActionExecution {
  actionId: string;
  actionName: string;
  executed: boolean;
  toolOutput: Record<string, unknown>;
  verificationPassed: boolean;
}

export interface EscalationDossier {
  escalationReason: string;
  urgencyLevel: TicketPriority;
  assignedQueue: string;
  symptomsSummary: string;
  diagnosticFindings: string;
  failedActionsAttempted?: string[];
  recommendedHumanAction: string;
}

export interface InvestigationResult {
  ticketId: string;
  outcome: 'RESOLVED' | 'ESCALATED';
  stages: WorkflowStageResult[];
  finalDecision: string;
  finalRationale: string;
  confidence: number;
  remediationAction?: RemediationActionExecution;
  escalationDossier?: EscalationDossier;
  completedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  employeeEmail: string;
  employeeName: string;
  department: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  scenarioKey: 'dns_portal' | 'account_lock' | 'vpn_cert' | 'software_request' | 'hardware_failure';
  investigationResult?: InvestigationResult;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  summary: string;
  content: string;
  approvedRemediation?: {
    actionId: string;
    actionName: string;
    isAutomated: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
