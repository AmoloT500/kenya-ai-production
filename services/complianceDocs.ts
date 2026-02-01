export const REGULATORY_REVIEW_SUMMARY = `
Kenya AI is a professional decision-support and productivity platform designed to assist healthcare, education, government, business, and NGO professionals. The platform provides drafting assistance, explanations, and structured reasoning while explicitly not providing diagnoses, prescriptions, legally binding advice, or policy decisions.

Kenya AI operates strictly as a human-in-the-loop system. All outputs are supportive and informational, with final decisions remaining the responsibility of qualified professionals and institutional processes.

The platform incorporates multiple safety measures including role-based modules, feature flags, automated refusals, safety interrupts, mandatory disclaimers, and escalation guidance. High-risk functionality is controlled and monitored.

Kenya AI applies strict data minimization practices. No raw complaint text, personal data, medical records, or legal documents are stored in audit logs. Analytics are metadata-only and anonymized. All data is protected through encryption and role-based access controls.

AI governance is maintained through version-controlled prompts, change logs, CI/CD compliance gates, automated testing, and regular safety reviews. Compliance officers and auditors have read-only oversight access.

A structured risk assessment has been conducted, with mitigations in place for medical misuse, legal liability, political bias, abuse, and over-reliance on AI.

Kenya AI maintains clear accountability, including a named platform owner, a designated compliance contact, and a documented incident response process.
`;

export const AUDIT_LOGGING_POLICY = `
Kenya AI maintains immutable, metadata-only audit logs to ensure ethical use, regulatory compliance, and institutional trust.

Audit logs record system behavior and safety events without storing user-generated content, personal data, medical information, or legal material.

Each audit log entry includes:
- Event identifier and timestamp
- Institution and sector
- Module in use
- Action type
- Safety interrupt status
- Refusal status
- Escalation recommendation status
- Feature flag state
- Active prompt version

Audit logs are append-only, role-restricted, and retained for 12–24 months depending on institutional policy. Logs are exportable in anonymized formats for regulatory, donor, and audit review.

Kenya AI does not store or expose raw complaint text, user messages, or sensitive professional data within audit logs.
`;
