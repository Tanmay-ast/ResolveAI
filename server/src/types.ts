export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';

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

export interface NetworkTelemetry {
  gatewayStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dnsResolution: 'FAILING' | 'RESOLVED';
  localIp: string;
  portalDnsLookup: string;
  captivePortalDetected: boolean;
  vpnConnected: boolean;
  vpnCertExpiresAt?: string;
  vpnCertStatus?: 'VALID' | 'EXPIRED' | 'REVOKED';
}

export interface IdentityTelemetry {
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  failedAttempts: number;
  mfaStatus: 'VALID' | 'EXPIRED' | 'UNENROLLED';
  lastLogin: string;
  lastPasswordChange: string;
}

export interface DeviceTelemetry {
  hostname: string;
  osVersion: string;
  diskEncryption: 'COMPLIANT' | 'NON_COMPLIANT';
  hardwareHealth: {
    diskSmartStatus: 'HEALTHY' | 'CRITICAL_FAILURE';
    batteryHealthPercent: number;
    thermalStatus: 'NORMAL' | 'OVERHEATING';
    badSectorCount: number;
  };
  installedSoftware: string[];
  pendingSoftwareRequests?: string[];
}

export interface EmployeeTelemetry {
  employeeEmail: string;
  network: NetworkTelemetry;
  identity: IdentityTelemetry;
  device: DeviceTelemetry;
}

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
