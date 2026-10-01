import { MOCK_TELEMETRY } from '../data/mockData.js';
import { ToolCall, NetworkTelemetry, IdentityTelemetry, DeviceTelemetry } from '../types.js';

export function probeNetworkTelemetry(employeeEmail: string): { data: NetworkTelemetry; toolCall: ToolCall } {
  const telemetry = MOCK_TELEMETRY[employeeEmail]?.network || {
    gatewayStatus: 'ONLINE',
    dnsResolution: 'FAILING',
    localIp: '192.168.1.100',
    portalDnsLookup: '0.0.0.0 (NXDOMAIN)',
    captivePortalDetected: false,
    vpnConnected: false
  };

  const toolCall: ToolCall = {
    toolName: 'probeNetworkTelemetry',
    input: { employeeEmail },
    output: { ...telemetry },
    timestamp: new Date().toISOString()
  };

  return { data: telemetry, toolCall };
}

export function probeIdentityTelemetry(employeeEmail: string): { data: IdentityTelemetry; toolCall: ToolCall } {
  const telemetry = MOCK_TELEMETRY[employeeEmail]?.identity || {
    accountStatus: 'ACTIVE',
    failedAttempts: 0,
    mfaStatus: 'VALID',
    lastLogin: new Date().toISOString(),
    lastPasswordChange: new Date().toISOString()
  };

  const toolCall: ToolCall = {
    toolName: 'probeIdentityTelemetry',
    input: { employeeEmail },
    output: { ...telemetry },
    timestamp: new Date().toISOString()
  };

  return { data: telemetry, toolCall };
}

export function probeDeviceTelemetry(employeeEmail: string): { data: DeviceTelemetry; toolCall: ToolCall } {
  const telemetry = MOCK_TELEMETRY[employeeEmail]?.device || {
    hostname: 'ACME-GENERIC-PC',
    osVersion: 'Windows 11 Enterprise',
    diskEncryption: 'COMPLIANT',
    hardwareHealth: {
      diskSmartStatus: 'HEALTHY',
      batteryHealthPercent: 90,
      thermalStatus: 'NORMAL',
      badSectorCount: 0
    },
    installedSoftware: ['Chrome', 'Slack']
  };

  const toolCall: ToolCall = {
    toolName: 'probeDeviceTelemetry',
    input: { employeeEmail },
    output: { ...telemetry },
    timestamp: new Date().toISOString()
  };

  return { data: telemetry, toolCall };
}
