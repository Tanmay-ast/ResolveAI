import { Ticket, WorkflowStageResult, ToolCall, StageEvidence } from '../types.js';
import { probeNetworkTelemetry, probeIdentityTelemetry, probeDeviceTelemetry } from '../tools/telemetryTools.js';

export function executeDiagnosis(ticket: Ticket, triageResult: WorkflowStageResult): {
  stageResult: WorkflowStageResult;
  telemetryData: Record<string, unknown>;
} {
  const toolCalls: ToolCall[] = [];
  const evidence: StageEvidence[] = [];
  const telemetryData: Record<string, unknown> = {};

  const category = (triageResult.evidence.find(e => e.label === 'Identified Category')?.value as string) || '';

  // 1. If Network related, execute network telemetry probe
  if (category.includes('Network') || category.includes('Access') || ticket.scenarioKey === 'dns_portal' || ticket.scenarioKey === 'vpn_cert') {
    const net = probeNetworkTelemetry(ticket.employeeEmail);
    toolCalls.push(net.toolCall);
    telemetryData['network'] = net.data;

    evidence.push({ label: 'Default Gateway Status', value: net.data.gatewayStatus, source: 'Network Probe' });
    evidence.push({ label: 'DNS Resolution State', value: net.data.dnsResolution, source: 'Resolver Tool' });
    evidence.push({ label: 'Portal Host Lookup', value: net.data.portalDnsLookup, source: 'DNS Cache Probe' });
    if (net.data.vpnCertStatus) {
      evidence.push({ label: 'VPN Client Certificate', value: net.data.vpnCertStatus, source: 'GlobalProtect Gateway' });
    }
  }

  // 2. If Identity related or account locked
  if (category.includes('Identity') || ticket.scenarioKey === 'account_lock') {
    const idp = probeIdentityTelemetry(ticket.employeeEmail);
    toolCalls.push(idp.toolCall);
    telemetryData['identity'] = idp.data;

    evidence.push({ label: 'Identity Account Status', value: idp.data.accountStatus, source: 'Okta / AD' });
    evidence.push({ label: 'Consecutive Failed Logins', value: idp.data.failedAttempts, source: 'Auth Audit Log' });
    evidence.push({ label: 'MFA Enrollment State', value: idp.data.mfaStatus, source: 'MFA Validator' });
  }

  // 3. Device & Endpoint telemetry
  const dev = probeDeviceTelemetry(ticket.employeeEmail);
  toolCalls.push(dev.toolCall);
  telemetryData['device'] = dev.data;

  evidence.push({ label: 'Endpoint Device Hostname', value: dev.data.hostname, source: 'Jamf MDM' });
  evidence.push({ label: 'Operating System', value: dev.data.osVersion, source: 'Endpoint Agent' });
  
  if (ticket.scenarioKey === 'hardware_failure') {
    evidence.push({ label: 'S.M.A.R.T. Disk Health', value: dev.data.hardwareHealth.diskSmartStatus, source: 'Hardware Telemetry' });
    evidence.push({ label: 'Bad Sector Count', value: dev.data.hardwareHealth.badSectorCount, source: 'Drive Controller' });
    evidence.push({ label: 'Thermal Controller State', value: dev.data.hardwareHealth.thermalStatus, source: 'Motherboard Sensors' });
  }

  // Determine diagnosis decision summary
  let decision = 'Telemetry gathered across endpoint and enterprise infrastructure.';
  let rationale = 'System metrics correlate directly with ticket symptoms.';
  let confidence = 95;

  if (ticket.scenarioKey === 'dns_portal') {
    decision = 'Detected DNS resolver corruption: Default gateway is ONLINE (192.168.1.142) but portal DNS query resolves to NXDOMAIN (0.0.0.0).';
    rationale = 'The network adapter is functioning and connected, but the local OS DNS cache contains corrupted records for portal.acme-corp.internal.';
    confidence = 97;
  } else if (ticket.scenarioKey === 'account_lock') {
    decision = 'Detected hard account lockout in Identity Provider with 4 consecutive failed password attempts.';
    rationale = 'User account is locked per security policy after repeated incorrect passwords. MFA token remains valid.';
    confidence = 98;
  } else if (ticket.scenarioKey === 'vpn_cert') {
    decision = 'Detected expired client TLS certificate on GlobalProtect VPN client (Expired: 2026-09-29).';
    rationale = 'VPN gateway handshake failed with code SEC_ERR_CERT_EXPIRED. Client certificate renewal is required.';
    confidence = 96;
  } else if (ticket.scenarioKey === 'software_request') {
    decision = 'Device verified as standard non-privileged engineering workstation without Docker Enterprise seat allocation.';
    rationale = 'User lacks active commercial license and endpoint privilege management authorization for local root/admin.';
    confidence = 93;
  } else if (ticket.scenarioKey === 'hardware_failure') {
    decision = 'Critical hardware fault verified: S.M.A.R.T. status CRITICAL_FAILURE with 4,812 bad sectors and thermal overheat.';
    rationale = 'Physical storage controller is experiencing mechanical breakdown. Drive failure is imminent; software remediation impossible.';
    confidence = 99;
  }

  const stageResult: WorkflowStageResult = {
    stage: 'diagnosis',
    stageName: '3. System Telemetry & Live Diagnosis',
    status: 'SUCCESS',
    evidence,
    toolCalls,
    decision,
    rationale,
    confidence
  };

  return { stageResult, telemetryData };
}
