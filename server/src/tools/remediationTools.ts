import { MOCK_TELEMETRY } from '../data/mockData.js';
import { ToolCall, RemediationActionExecution } from '../types.js';

export function executeFlushDns(employeeEmail: string): { execution: RemediationActionExecution; toolCall: ToolCall } {
  // Simulate performing DNS cache flush and DHCP renewal
  const record = MOCK_TELEMETRY[employeeEmail];
  if (record) {
    record.network.dnsResolution = 'RESOLVED';
    record.network.portalDnsLookup = '10.240.12.84 (Corporate Portal VIP)';
  }

  const toolOutput = {
    command: 'dscacheutil -flushcache && killall -HUP mDNSResponder',
    status: 'SUCCESS',
    exitCode: 0,
    dhcpLeaseRenewed: true,
    newDnsResolution: 'portal.acme-corp.internal -> 10.240.12.84',
    httpVerification: 'HTTP/1.1 200 OK (Latency: 18ms)'
  };

  const toolCall: ToolCall = {
    toolName: 'executeFlushDnsAndRenewDhcp',
    input: { employeeEmail, targetDomain: 'portal.acme-corp.internal' },
    output: toolOutput,
    timestamp: new Date().toISOString()
  };

  const execution: RemediationActionExecution = {
    actionId: 'ACT_FLUSH_DNS_RENEW_DHCP',
    actionName: 'Flush Local DNS Resolver Cache & Renew DHCP Lease',
    executed: true,
    toolOutput,
    verificationPassed: true
  };

  return { execution, toolCall };
}

export function executeUnlockAccount(employeeEmail: string): { execution: RemediationActionExecution; toolCall: ToolCall } {
  const record = MOCK_TELEMETRY[employeeEmail];
  if (record) {
    record.identity.accountStatus = 'ACTIVE';
    record.identity.failedAttempts = 0;
  }

  const toolOutput = {
    directoryService: 'Okta Identity Cloud / AD Sync',
    status: 'ACCOUNT_UNLOCKED',
    failedAttemptsResetTo: 0,
    mfaVerificationVerified: true,
    temporaryTokenDispatched: true,
    auditEventId: `SEC-AUDIT-${Math.floor(100000 + Math.random() * 900000)}`
  };

  const toolCall: ToolCall = {
    toolName: 'executeUnlockIdentityAccount',
    input: { employeeEmail },
    output: toolOutput,
    timestamp: new Date().toISOString()
  };

  const execution: RemediationActionExecution = {
    actionId: 'ACT_UNLOCK_IDENTITY_ACCOUNT',
    actionName: 'Unlock User Account in Identity Directory & Reset Lock Counter',
    executed: true,
    toolOutput,
    verificationPassed: true
  };

  return { execution, toolCall };
}
