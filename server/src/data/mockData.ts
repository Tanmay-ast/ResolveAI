import { Ticket, KnowledgeArticle, EmployeeTelemetry } from '../types.js';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-1001',
    title: 'Cannot access company portal over Wi-Fi',
    description: 'My laptop is connected to Wi-Fi, but I cannot access the company portal.',
    employeeEmail: 'sarah.chen@acme-corp.internal',
    employeeName: 'Sarah Chen',
    department: 'Product Engineering',
    category: 'Network & Access',
    priority: 'P2',
    status: 'OPEN',
    createdAt: '2026-10-01T08:15:00Z',
    scenarioKey: 'dns_portal'
  },
  {
    id: 'TCK-1002',
    title: 'Single Sign-On account locked after failed logins',
    description: 'I entered my password wrong 3 times and now I am locked out of single sign-on and email.',
    employeeEmail: 'marcus.vance@acme-corp.internal',
    employeeName: 'Marcus Vance',
    department: 'Global Sales',
    category: 'Identity & Access',
    priority: 'P2',
    status: 'OPEN',
    createdAt: '2026-10-01T08:30:00Z',
    scenarioKey: 'account_lock'
  },
  {
    id: 'TCK-1003',
    title: 'GlobalProtect VPN connection error: Certificate Expired',
    description: 'GlobalProtect VPN client fails to connect with error "Gateway rejected client certificate: expired or revoked".',
    employeeEmail: 'elena.rostova@acme-corp.internal',
    employeeName: 'Elena Rostova',
    department: 'Finance & Compliance',
    category: 'Network & Security',
    priority: 'P2',
    status: 'OPEN',
    createdAt: '2026-10-01T09:00:00Z',
    scenarioKey: 'vpn_cert'
  },
  {
    id: 'TCK-1004',
    title: 'Request for Docker Desktop and local root/admin access',
    description: 'Need local administrator privileges to install Docker Desktop for project onboarding.',
    employeeEmail: 'david.kim@acme-corp.internal',
    employeeName: 'David Kim',
    department: 'Data Platforms',
    category: 'Software & Approvals',
    priority: 'P3',
    status: 'OPEN',
    createdAt: '2026-10-01T09:45:00Z',
    scenarioKey: 'software_request'
  },
  {
    id: 'TCK-1005',
    title: 'Violent screen flickering, grinding noises, and S.M.A.R.T. disk error on boot',
    description: 'My laptop started making rhythmic clicking noises, the screen flickers violently, and BIOS displays "S.M.A.R.T. Hard Disk Imminent Failure".',
    employeeEmail: 'priya.sharma@acme-corp.internal',
    employeeName: 'Priya Sharma',
    department: 'UX Design',
    category: 'Hardware & Workstation',
    priority: 'P1',
    status: 'OPEN',
    createdAt: '2026-10-01T10:10:00Z',
    scenarioKey: 'hardware_failure'
  }
];

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'KB-NET-01',
    title: 'SOP: Troubleshooting Company Portal and Internal DNS Resolution Issues',
    category: 'Network & Access',
    keywords: ['wifi', 'wi-fi', 'portal', 'dns', 'company portal', 'resolution', 'network', 'gateway'],
    summary: 'Standard troubleshooting procedure when endpoints are connected to Wi-Fi but fail to resolve internal company portal hostnames.',
    content: `When an employee is connected to corporate Wi-Fi or home office network but cannot access portal.acme-corp.internal:
1. Verify default gateway ping latency and local IPv4 address allocation.
2. Check local DNS resolver cache. Stale DNS cache frequently maps internal portal hostnames to NXDOMAIN (0.0.0.0).
3. If DNS query returns NXDOMAIN while gateway is ONLINE, execute standard DNS Flush and DHCP Lease Renewal.
4. Verify HTTP 200 response on portal health probe. If resolution succeeds, ticket is safely resolved.`,
    approvedRemediation: {
      actionId: 'ACT_FLUSH_DNS_RENEW_DHCP',
      actionName: 'Flush DNS Cache & Renew DHCP Lease',
      isAutomated: true,
      riskLevel: 'LOW'
    }
  },
  {
    id: 'KB-SEC-04',
    title: 'SOP: Identity & Single Sign-On Account Lockout Remediation',
    category: 'Identity & Access',
    keywords: ['password', 'locked', 'lockout', 'sso', 'single sign-on', 'okta', 'active directory', 'attempts'],
    summary: 'Automated self-service unlock procedure for user accounts locked out due to consecutive failed password attempts.',
    content: `Account Lockout Policy:
1. Users are locked out after 3 incorrect password entries within 15 minutes.
2. Check Identity directory (Okta/Active Directory) for accountStatus == 'LOCKED'.
3. Validate MFA enrollment state. If MFA is active and device is compliant, automated unlock is safe to perform.
4. Execute unlockAccount tool, resetting failed login counters to 0 and sending a temporary authentication challenge.`,
    approvedRemediation: {
      actionId: 'ACT_UNLOCK_IDENTITY_ACCOUNT',
      actionName: 'Unlock User Account in Identity Directory & Reset Lock Counter',
      isAutomated: true,
      riskLevel: 'LOW'
    }
  },
  {
    id: 'KB-VPN-02',
    title: 'SOP: VPN Machine Certificate Expiration & Renewal Protocol',
    category: 'Network & Security',
    keywords: ['vpn', 'globalprotect', 'certificate', 'cert', 'expired', 'revoked', 'handshake'],
    summary: 'Protocol for resolving VPN connection failures caused by expired client machine certificates.',
    content: `VPN Machine Certificate Expiration:
1. GlobalProtect requires mutual TLS (mTLS) with an active X.509 machine certificate issued by Acme Internal CA.
2. If client certificate is expired or revoked, automated in-band client renewal is restricted by InfoSec Policy #SEC-882.
3. Machine certificate re-issuance requires cryptographic CSR approval signed by Level 2 SecOps / NetOps.
4. Mandatory Escalation: Route ticket to SecOps queue with client machine serial and certificate thumbprint.`,
    approvedRemediation: {
      actionId: 'ACT_ESCALATE_SECOPS_CERT',
      actionName: 'Escalate to SecOps for Manual Certificate Reissuance',
      isAutomated: false,
      riskLevel: 'MEDIUM'
    }
  },
  {
    id: 'KB-APP-09',
    title: 'SOP: Developer Software Licensing & Local Admin Privilege Protocol',
    category: 'Software & Approvals',
    keywords: ['docker', 'admin', 'privileges', 'license', 'install', 'software', 'root', 'approval'],
    summary: 'Governance policy regarding requests for commercial software and local administrative rights.',
    content: `Administrative Privilege & Software Compliance Policy:
1. ResolveAI is prohibited from autonomously granting permanent or temporary local administrator permissions.
2. Docker Desktop requires paid commercial seat allocation and manager budget authorization.
3. Mandatory Escalation: Package developer details, project billing code, and manager sign-off checklist for IT Governance approval.`,
    approvedRemediation: {
      actionId: 'ACT_ESCALATE_POLICY_APPROVAL',
      actionName: 'Escalate to IT Governance & Manager Approval Queue',
      isAutomated: false,
      riskLevel: 'HIGH'
    }
  },
  {
    id: 'KB-HW-15',
    title: 'SOP: Critical Physical Storage Degradation & Workstation Replacement',
    category: 'Hardware & Workstation',
    keywords: ['grinding', 'clicking', 'smart', 'disk', 'hardware', 'flicker', 'crash', 'boot', 'failure'],
    summary: 'Emergency protocol for unrecoverable workstation hardware failures and imminent drive death.',
    content: `Emergency Physical Hardware Protocol:
1. Symptoms of mechanical clicking/grinding and S.M.A.R.T. critical warnings indicate irreversible physical degradation.
2. Software remediation is strictly forbidden to prevent catastrophic data loss or physical fire hazard.
3. Mandatory Emergency Escalation: Immediate dispatch to IT Depot & Field Support. Schedule priority loaner laptop exchange and trigger emergency cloud backup snapshot.`,
    approvedRemediation: {
      actionId: 'ACT_ESCALATE_HARDWARE_DEPOT',
      actionName: 'Emergency Escalation to IT Depot for Physical Hardware Replacement',
      isAutomated: false,
      riskLevel: 'HIGH'
    }
  }
];

export const MOCK_TELEMETRY: Record<string, EmployeeTelemetry> = {
  'sarah.chen@acme-corp.internal': {
    employeeEmail: 'sarah.chen@acme-corp.internal',
    network: {
      gatewayStatus: 'ONLINE',
      dnsResolution: 'FAILING',
      localIp: '192.168.1.142',
      portalDnsLookup: '0.0.0.0 (NXDOMAIN - Cache Corrupt)',
      captivePortalDetected: false,
      vpnConnected: false
    },
    identity: {
      accountStatus: 'ACTIVE',
      failedAttempts: 0,
      mfaStatus: 'VALID',
      lastLogin: '2026-10-01T08:02:11Z',
      lastPasswordChange: '2026-08-15T10:00:00Z'
    },
    device: {
      hostname: 'ACME-MAC-0419',
      osVersion: 'macOS 15.1 Sequoia',
      diskEncryption: 'COMPLIANT',
      hardwareHealth: {
        diskSmartStatus: 'HEALTHY',
        batteryHealthPercent: 94,
        thermalStatus: 'NORMAL',
        badSectorCount: 0
      },
      installedSoftware: ['Google Chrome', 'Slack', 'VS Code', 'Zoom']
    }
  },
  'marcus.vance@acme-corp.internal': {
    employeeEmail: 'marcus.vance@acme-corp.internal',
    network: {
      gatewayStatus: 'ONLINE',
      dnsResolution: 'RESOLVED',
      localIp: '10.24.18.99',
      portalDnsLookup: '10.240.12.84',
      captivePortalDetected: false,
      vpnConnected: true
    },
    identity: {
      accountStatus: 'LOCKED',
      failedAttempts: 4,
      mfaStatus: 'VALID',
      lastLogin: '2026-09-30T17:45:00Z',
      lastPasswordChange: '2026-07-10T14:20:00Z'
    },
    device: {
      hostname: 'ACME-WIN-1082',
      osVersion: 'Windows 11 Enterprise 23H2',
      diskEncryption: 'COMPLIANT',
      hardwareHealth: {
        diskSmartStatus: 'HEALTHY',
        batteryHealthPercent: 88,
        thermalStatus: 'NORMAL',
        badSectorCount: 0
      },
      installedSoftware: ['Microsoft 365', 'Salesforce Agent', 'Slack', 'Edge']
    }
  },
  'elena.rostova@acme-corp.internal': {
    employeeEmail: 'elena.rostova@acme-corp.internal',
    network: {
      gatewayStatus: 'ONLINE',
      dnsResolution: 'RESOLVED',
      localIp: '192.168.0.45',
      portalDnsLookup: '10.240.12.84',
      captivePortalDetected: false,
      vpnConnected: false,
      vpnCertStatus: 'EXPIRED',
      vpnCertExpiresAt: '2026-09-29T23:59:59Z'
    },
    identity: {
      accountStatus: 'ACTIVE',
      failedAttempts: 0,
      mfaStatus: 'VALID',
      lastLogin: '2026-10-01T08:50:00Z',
      lastPasswordChange: '2026-09-01T11:00:00Z'
    },
    device: {
      hostname: 'ACME-FIN-7721',
      osVersion: 'Windows 11 Enterprise 23H2',
      diskEncryption: 'COMPLIANT',
      hardwareHealth: {
        diskSmartStatus: 'HEALTHY',
        batteryHealthPercent: 91,
        thermalStatus: 'NORMAL',
        badSectorCount: 0
      },
      installedSoftware: ['SAP GUI', 'Excel', 'GlobalProtect 6.2', 'Teams']
    }
  },
  'david.kim@acme-corp.internal': {
    employeeEmail: 'david.kim@acme-corp.internal',
    network: {
      gatewayStatus: 'ONLINE',
      dnsResolution: 'RESOLVED',
      localIp: '192.168.1.88',
      portalDnsLookup: '10.240.12.84',
      captivePortalDetected: false,
      vpnConnected: true
    },
    identity: {
      accountStatus: 'ACTIVE',
      failedAttempts: 0,
      mfaStatus: 'VALID',
      lastLogin: '2026-10-01T09:30:00Z',
      lastPasswordChange: '2026-09-12T09:00:00Z'
    },
    device: {
      hostname: 'ACME-ENG-9104',
      osVersion: 'Ubuntu 24.04 LTS',
      diskEncryption: 'COMPLIANT',
      hardwareHealth: {
        diskSmartStatus: 'HEALTHY',
        batteryHealthPercent: 98,
        thermalStatus: 'NORMAL',
        badSectorCount: 0
      },
      installedSoftware: ['Node.js', 'Python', 'VS Code', 'Git'],
      pendingSoftwareRequests: ['Docker Desktop Enterprise Seat']
    }
  },
  'priya.sharma@acme-corp.internal': {
    employeeEmail: 'priya.sharma@acme-corp.internal',
    network: {
      gatewayStatus: 'DEGRADED',
      dnsResolution: 'FAILING',
      localIp: '192.168.10.51',
      portalDnsLookup: 'UNREACHABLE',
      captivePortalDetected: false,
      vpnConnected: false
    },
    identity: {
      accountStatus: 'ACTIVE',
      failedAttempts: 0,
      mfaStatus: 'VALID',
      lastLogin: '2026-10-01T09:55:00Z',
      lastPasswordChange: '2026-08-20T16:00:00Z'
    },
    device: {
      hostname: 'ACME-DES-3320',
      osVersion: 'macOS 14.6 Sonoma',
      diskEncryption: 'NON_COMPLIANT',
      hardwareHealth: {
        diskSmartStatus: 'CRITICAL_FAILURE',
        batteryHealthPercent: 42,
        thermalStatus: 'OVERHEATING',
        badSectorCount: 4812
      },
      installedSoftware: ['Figma', 'Adobe Creative Cloud', 'Slack']
    }
  }
};
