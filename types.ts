export type AIModule = 
  | 'General' 
  | 'Healthcare' 
  | 'Emergency' 
  | 'Legal' 
  | 'Education' 
  | 'Business' 
  | 'Government' 
  | 'Creative'
  | 'Concerns'
  | 'Response';

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingUrls?: Array<{ title: string; uri: string }>;
  module?: AIModule;
}

export interface ImageResult {
  url: string;
  prompt: string;
  timestamp: Date;
}

export enum AppTab {
  CHAT = 'chat',
  IMAGE_GEN = 'image_gen',
  PRICING = 'pricing',
  DEMOS = 'demos',
  ACCOUNT = 'account',
  ADMIN = 'admin'
}

export interface ModuleConfig {
  id: AIModule;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export interface FeatureFlags {
  complaints_assistant: boolean;
  complaints_public_drafting: boolean;
  complaints_institution_response: boolean;
  complaints_safety_interrupt: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  details: string;
}

export interface ComplianceReport {
  overallStatus: 'valid' | 'blocked';
  checks: ComplianceCheck[];
  timestamp: string;
}

export interface EdgeCaseTest {
  name: string;
  input: string;
  expectedBehavior: {
    triggerSafetyInterrupt?: boolean;
    refusePunishment?: boolean;
    reframeToReview?: boolean;
    avoidLegalConclusion?: boolean;
    suggestOfficialChannel?: boolean;
    removePoliticalLanguage?: boolean;
    remainNeutral?: boolean;
    noGuarantees?: boolean;
    explainProcessOnly?: boolean;
    tone?: string;
    noBlame?: boolean;
  };
}

export interface TestResult {
  testName: string;
  passed: boolean;
  actualBehavior: string;
  timestamp: string;
}

export type AdminRole = 'Platform Admin' | 'Institution Admin' | 'Compliance Officer' | 'Auditor';

export interface DashboardStats {
  totalUsers: number;
  activeUsers7d: number;
  sessionsByModule: Record<string, number>;
  complaintsDrafts: number;
  complaintsResponses: number;
  safetyInterrupts: number;
  testSuitePassRate: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  institution: string;
  module: AIModule;
  actionType: string;
  safetyTriggered: boolean;
  promptVersion: string;
}

// Wired based on FEATURE FLAGS (HOW TO WIRE IT) documentation
export const FEATURE_FLAGS: FeatureFlags = {
  complaints_assistant: true, 
  complaints_public_drafting: true, 
  complaints_institution_response: true, 
  complaints_safety_interrupt: true, 
};

export const MODULE_CONFIGS: Record<AIModule, ModuleConfig> = {
  General: {
    id: 'General',
    label: 'KenyaAI General',
    icon: 'fas fa-mountain-sun',
    color: 'bg-green-700',
    bgColor: 'bg-green-50',
    description: 'General knowledge, culture, and travel guide for Kenya.'
  },
  Healthcare: {
    id: 'Healthcare',
    label: 'Healthcare Support',
    icon: 'fas fa-user-md',
    color: 'bg-blue-700',
    bgColor: 'bg-blue-50',
    description: 'Clinical reasoning support and patient education.'
  },
  Emergency: {
    id: 'Emergency',
    label: 'Emergency Response',
    icon: 'fas fa-ambulance',
    color: 'bg-red-600',
    bgColor: 'bg-red-50',
    description: 'First aid and paramedic guidance.'
  },
  Legal: {
    id: 'Legal',
    label: 'Legal Professional',
    icon: 'fas fa-gavel',
    color: 'bg-slate-800',
    bgColor: 'bg-slate-50',
    description: 'Legal drafting, research, and documentation.'
  },
  Education: {
    id: 'Education',
    label: 'Education & Academic',
    icon: 'fas fa-graduation-cap',
    color: 'bg-purple-700',
    bgColor: 'bg-purple-50',
    description: 'Lesson planning and concept explanation.'
  },
  Business: {
    id: 'Business',
    label: 'Business Strategy',
    icon: 'fas fa-briefcase',
    color: 'bg-amber-700',
    bgColor: 'bg-amber-50',
    description: 'Business plans, strategy, and SME support.'
  },
  Government: {
    id: 'Government',
    label: 'Gov & Policy',
    icon: 'fas fa-landmark',
    color: 'bg-cyan-700',
    bgColor: 'bg-cyan-50',
    description: 'Public policy and governance support.'
  },
  Creative: {
    id: 'Creative',
    label: 'Creative Studio',
    icon: 'fas fa-palette',
    color: 'bg-rose-600',
    bgColor: 'bg-rose-50',
    description: 'Image generation and professional content.'
  },
  Concerns: {
    id: 'Concerns',
    label: 'Concerns & Complaints',
    icon: 'fas fa-pen-to-square',
    color: 'bg-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Professional drafting support for formal concerns.'
  },
  Response: {
    id: 'Response',
    label: 'Complaint Response',
    icon: 'fas fa-reply',
    color: 'bg-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Institutional support for drafting formal responses.'
  }
};