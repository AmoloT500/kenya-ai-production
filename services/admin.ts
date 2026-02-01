
import { DashboardStats, AuditLogEntry, AIModule } from "../types";

// Adding missing testSuitePassRate to satisfy the DashboardStats interface requirement
export const getMockDashboardStats = (): DashboardStats => ({
  totalUsers: 1452,
  activeUsers7d: 842,
  sessionsByModule: {
    'Healthcare': 452,
    'Education': 321,
    'Government': 184,
    'Business': 267,
    'Legal': 112,
    'General': 654
  },
  complaintsDrafts: 342,
  complaintsResponses: 156,
  safetyInterrupts: 24,
  testSuitePassRate: 98.5
});

export const getMockAuditLogs = (): AuditLogEntry[] => [
  {
    id: 'audit-1',
    timestamp: '2024-05-20T10:32:00Z',
    institution: 'Central Public Hospital',
    module: 'Healthcare',
    actionType: 'Clinical Guidance Query',
    safetyTriggered: false,
    promptVersion: 'v5.2.1'
  },
  {
    id: 'audit-2',
    timestamp: '2024-05-20T11:15:00Z',
    institution: 'City High School',
    module: 'Education',
    actionType: 'Lesson Plan Generation',
    safetyTriggered: false,
    promptVersion: 'v5.2.1'
  },
  {
    id: 'audit-3',
    timestamp: '2024-05-20T12:05:00Z',
    institution: 'Public Health Department',
    module: 'Concerns',
    actionType: 'Complaint Draft (Citizen)',
    safetyTriggered: true,
    promptVersion: 'v5.2.1'
  },
  {
    id: 'audit-4',
    timestamp: '2024-05-20T13:45:00Z',
    institution: 'Kenya Legal Aid',
    module: 'Legal',
    actionType: 'Drafting Support',
    safetyTriggered: false,
    promptVersion: 'v5.2.1'
  }
];

export const exportReport = (format: 'PDF' | 'CSV' | 'JSON', type: string) => {
  console.log(`Exporting ${type} as ${format}...`);
  // Mock download trigger
  alert(`${type} report exported as ${format}.`);
};
