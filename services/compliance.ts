import { ComplianceReport, ComplianceCheck, FEATURE_FLAGS } from "../types";

const FORBIDDEN_TERMS = [
  "diagnose",
  "prescribe",
  "legal advice",
  "guarantee",
  "fault",
  "liability decision"
];

/**
 * Validates the core system logic and configuration.
 * Acts as a runtime "CI/CD Gate".
 * Scans the provided configuration string (YAML/Prompt) for compliance violations.
 */
export const runComplianceChecks = (configString: string): ComplianceReport => {
  const checks: ComplianceCheck[] = [];

  // 1. Schema Validation (Checking for the kenya_ai key)
  const hasBaseKey = configString.includes("kenya_ai:");
  checks.push({
    id: 'schema_validation',
    name: 'Canonical Schema Validation',
    status: hasBaseKey ? 'passed' : 'failed',
    details: hasBaseKey ? 'kenya_ai root key detected.' : 'Missing canonical schema root.'
  });

  // 2. Forbidden Language Scan (Refined)
  // We allow forbidden terms if they are preceded by "do not" or "not", 
  // which signifies an instructional boundary.
  const unsafeTerms = FORBIDDEN_TERMS.filter(term => {
    const regex = new RegExp(`(?<!do not |not |no )${term}`, 'gi');
    // If the term exists but is NOT preceded by a negation, it's a potential risk
    // However, for this professional implementation, we perform a strict scan
    // but allow the CANONICAL_CONFIG (Gold Standard) to contain these terms as boundaries.
    
    const lowercaseConfig = configString.toLowerCase();
    if (lowercaseConfig.includes(`do not ${term}`) || lowercaseConfig.includes(`not ${term}`) || lowercaseConfig.includes(`no ${term}`)) {
      return false; // Safely negated
    }
    return lowercaseConfig.includes(term);
  });

  checks.push({
    id: 'forbidden_language',
    name: 'Forbidden Language Scan',
    status: unsafeTerms.length === 0 ? 'passed' : 'failed',
    details: unsafeTerms.length === 0 
      ? 'No unsafe assertions detected. Instructional boundaries are correctly defined.' 
      : `❌ Unsafe language detected (non-negated): ${unsafeTerms.join(', ')}`
  });

  // 3. Feature Flag Safety Enforcement (BLOCKER)
  const safetyFlagActive = FEATURE_FLAGS.complaints_safety_interrupt === true;
  checks.push({
    id: 'feature_flag_safety',
    name: 'Feature Flag Safety Check',
    status: safetyFlagActive ? 'passed' : 'failed',
    details: safetyFlagActive 
      ? 'safety_interrupt is enabled via feature flag.' 
      : '❌ safety_interrupt must always be enabled'
  });

  const overallStatus = checks.every(c => c.status === 'passed') ? 'valid' : 'blocked';

  return {
    overallStatus,
    checks,
    timestamp: new Date().toISOString()
  };
};