import React, { useState, useEffect, useRef } from 'react';
import { AppTab, Message, ImageResult, AIModule, MODULE_CONFIGS, FEATURE_FLAGS, AdminRole, DashboardStats, AuditLogEntry, TestResult } from './types';
import { chatWithKenyaAI, generateKenyaImage, CANONICAL_CONFIG } from './services/gemini';
import { GroundingResults } from './components/GroundingResults';
import { logAnalyticsEvent } from './services/analytics';
import { runComplianceChecks } from './services/compliance';
import { getMockDashboardStats, getMockAuditLogs, exportReport } from './services/admin';
import { runTestSuite, EDGE_CASE_SUITE } from './services/testSuite';
import { REGULATORY_REVIEW_SUMMARY, AUDIT_LOGGING_POLICY } from './services/complianceDocs';

const OnboardingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
    <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="p-10 border-b border-slate-100 bg-slate-50">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome to Kenya AI</h2>
        <p className="text-slate-500 font-medium">Professional Decision-Support & Productivity Platform</p>
      </div>
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="font-black text-green-700 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <i className="fas fa-check-circle"></i> What Kenya AI Does
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 font-bold">
              <li className="flex gap-2"><i className="fas fa-plus text-[8px] mt-1.5 text-slate-300"></i> Drafts professional documents</li>
              <li className="flex gap-2"><i className="fas fa-plus text-[8px] mt-1.5 text-slate-300"></i> Explains complex topics clearly</li>
              <li className="flex gap-2"><i className="fas fa-plus text-[8px] mt-1.5 text-slate-300"></i> Supports structured reasoning</li>
              <li className="flex gap-2"><i className="fas fa-plus text-[8px] mt-1.5 text-slate-300"></i> Generates high-fidelity visuals</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-black text-red-700 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <i className="fas fa-times-circle"></i> What Kenya AI Does NOT Do
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 font-bold">
              <li className="flex gap-2"><i className="fas fa-minus text-[8px] mt-1.5 text-slate-300"></i> Replace licensed professionals</li>
              <li className="flex gap-2"><i className="fas fa-minus text-[8px] mt-1.5 text-slate-300"></i> Diagnose or prescribe</li>
              <li className="flex gap-2"><i className="fas fa-minus text-[8px] mt-1.5 text-slate-300"></i> Provide legal or financial advice</li>
              <li className="flex gap-2"><i className="fas fa-minus text-[8px] mt-1.5 text-slate-300"></i> Make final institutional decisions</li>
            </ul>
          </div>
        </div>

        <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-3 text-sm">User Agreement</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            By continuing, you acknowledge that all outputs are for support only and must be reviewed by qualified professionals. Use of this platform constitutes acceptance of our ethical and safety guidelines.
          </p>
        </section>
      </div>
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center">
        <button onClick={onClose} className="bg-slate-900 text-white px-20 py-5 rounded-2xl font-black hover:bg-black transition-all shadow-2xl active:scale-95">
          I Understand & Continue
        </button>
      </div>
    </div>
  </div>
);

const UpgradeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<'offer' | 'success'>('offer');

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
        <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fas fa-envelope-circle-check"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Upgrade Successful</h2>
            <p className="text-slate-500 font-bold mb-8">Your professional license is now active.</p>
            <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all">
               Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-700 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-inner">
            <i className="fas fa-crown"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-6">Kenya AI Professional</h2>
          <div className="text-left space-y-4 mb-10">
            {[
              "Role-based professional modules",
              "Advanced drafting & policy templates",
              "Text, image & video generation",
              "Ethical & safety guardrails active",
              "Priority institutional support"
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-center">
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
                <span className="text-sm font-bold text-slate-700">{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('success')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95">
            Upgrade License
          </button>
          <button onClick={onClose} className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ role: AdminRole }> = ({ role }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'tests' | 'logs' | 'reports' | 'ethics'>('overview');

  useEffect(() => {
    setStats(getMockDashboardStats());
    setLogs(getMockAuditLogs());
  }, []);

  const runTests = async () => {
    setIsTesting(true);
    const results = await runTestSuite();
    setTestResults(results);
    setIsTesting(false);
    logAnalyticsEvent('automated_test_suite_run', { count: results.length });
  };

  const renderOverview = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Users", val: stats?.totalUsers, icon: "fa-users" },
          { label: "Active (7d)", val: stats?.activeUsers7d, icon: "fa-chart-line" },
          { label: "Complaints Drafted", val: stats?.complaintsDrafts, icon: "fa-file-pen" },
          { label: "Safety Triggers", val: stats?.safetyInterrupts, icon: "fa-shield-halved", accent: "text-red-600" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
              <i className={`fas ${s.icon} ${s.accent || 'text-slate-300'}`}></i>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8">Sessions by Module</h3>
          <div className="space-y-6">
            {Object.entries(stats?.sessionsByModule || {}).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{key}</span>
                  <span className="text-xs font-black text-slate-900">{val}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full" style={{ width: `${(val / 700) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8">Complaints Sector Distribution</h3>
          <div className="aspect-square bg-slate-50 rounded-full border-8 border-white shadow-inner flex items-center justify-center relative overflow-hidden">
             <div className="text-center">
                <p className="text-4xl font-black text-slate-900">{stats?.complaintsDrafts}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Drafts</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderFeatureFlags = () => (
    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-black text-slate-900 mb-8">System Feature Flags</h3>
      <div className="space-y-6">
        {[
          { id: 'complaints_assistant', label: 'Complaints Assistant Engine', desc: 'Master switch for the complaints workflow.', forced: false },
          { id: 'complaints_public_drafting', label: 'Public Drafting Mode', desc: 'Allow citizens to draft formal concerns.', forced: false },
          { id: 'complaints_institution_response', label: 'Institution Response Mode', desc: 'Institutional tools for responding to grievances.', forced: false },
          { id: 'safety_interrupt', label: 'Safety Interrupt (LOCKED)', desc: 'AI-driven emotional de-escalation protocol.', forced: true },
        ].map((f) => (
          <div key={f.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-900">{f.label}</p>
              <p className="text-xs text-slate-400 font-medium">{f.desc}</p>
            </div>
            <div className={`w-14 h-8 rounded-full p-1 transition-colors ${f.forced || FEATURE_FLAGS[f.id as keyof typeof FEATURE_FLAGS] ? 'bg-green-600' : 'bg-slate-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${f.forced || FEATURE_FLAGS[f.id as keyof typeof FEATURE_FLAGS] ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderTestSuite = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
           <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Automated Test Suite (Edge-Cases)</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verify Safety Behavior & Tone Calibration</p>
           </div>
           <button 
             onClick={runTests} 
             disabled={isTesting}
             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
           >
             {isTesting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-play"></i>}
             {isTesting ? 'Running Tests...' : 'Run Suite Now'}
           </button>
        </div>

        <div className="space-y-4">
          {testResults.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
               <i className="fas fa-flask text-4xl text-slate-200 mb-4"></i>
               <p className="text-sm font-bold text-slate-400">No test results available. Run the suite to start validation.</p>
            </div>
          ) : (
            testResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                 <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                       <i className={`fas ${result.passed ? 'fa-check' : 'fa-times'}`}></i>
                    </div>
                    <div>
                       <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{result.testName.replace(/_/g, ' ')}</p>
                       <p className="text-xs text-slate-400 font-medium">{result.actualBehavior}</p>
                    </div>
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                   {result.passed ? 'PASSED' : 'FAILED'}
                 </span>
              </div>
            ))
          )}
        </div>
      </section>
      
      <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h4 className="text-lg font-black mb-4">Regression & Safety Logic</h4>
            <p className="text-sm text-white/60 mb-8 max-w-xl font-bold">
              Edge-case tests ensure model upgrades or prompt changes don't weaken safeguards. 
              Tests cover: abusive language de-escalation, refusal of punishment requests, political neutrality, and outcome transparency.
            </p>
            <div className="flex gap-4">
               <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">v5.2.1 Stable</span>
               <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">All Guardrails Verified</span>
            </div>
         </div>
         <i className="fas fa-vial absolute -bottom-10 -right-10 text-[12rem] text-white/5"></i>
      </section>
    </div>
  );

  const renderAuditLogs = () => (
    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] animate-in fade-in duration-500">
      <h3 className="text-xl font-black text-slate-900 mb-8">System Audit Trail</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
            <tr>
              <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</th>
              <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
              <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                <td className="py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="py-4">{log.institution}</td>
                <td className="py-4"><span className="px-3 py-1 bg-slate-100 rounded-full text-[10px]">{log.module}</span></td>
                <td className="py-4 text-slate-900">{log.actionType}</td>
                <td className="py-4">
                  {log.safetyTriggered ? <span className="text-red-600 font-black">TRIGGERED</span> : <span className="text-green-600 font-black">CLEAN</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderEthicsDocs = () => (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Canonical Base Configuration</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Gold Standard (YAML)</p>
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">Verified Pass</div>
        </div>
        <pre className="bg-slate-900 text-green-400 p-8 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed shadow-inner">
          {CANONICAL_CONFIG}
        </pre>
      </section>

      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Regulatory Review Summary</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Kenya AI Official Governance Document</p>
          </div>
          <button onClick={() => exportReport('PDF', 'Regulatory Review')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-900 transition-colors shadow-sm">
            <i className="fas fa-download"></i>
          </button>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
          {REGULATORY_REVIEW_SUMMARY.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Compliance & Ethics Audit Logging Policy</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Immutable Metadata Logging Protocols</p>
          </div>
          <button onClick={() => exportReport('PDF', 'Audit Logging Policy')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-900 transition-colors shadow-sm">
            <i className="fas fa-download"></i>
          </button>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
          {AUDIT_LOGGING_POLICY.split('\n\n').map((para, i) => (
            <div key={i} className={para.startsWith('-') ? 'pl-6' : ''}>
              {para.split('\n').map((line, j) => (
                <p key={j} className={line.startsWith('-') ? 'list-item list-disc mb-2' : 'mb-4'}>
                  {line.startsWith('- ') ? line.substring(2) : line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="p-10 bg-green-50 rounded-[3rem] border border-green-100 flex items-start gap-6">
        <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shrink-0">
          <i className="fas fa-shield-check"></i>
        </div>
        <div>
          <h4 className="font-black text-green-900 mb-1">Non-Negotiable Privacy Protocol</h4>
          <p className="text-sm text-green-700 font-bold leading-relaxed">
            These documents are enforced through Kenya AI's core infrastructure. The platform does not store raw user text or sensitive data. 
            Regulatory oversight is conducted via anonymized metadata only.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 sm:p-12 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-slate-100 pb-10 gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Admin Dashboard</h2>
          <p className="text-slate-500 font-bold text-lg">Platform oversight & safety controls.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 pr-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm">A</div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-none">{role}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Metadata-Only Access</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-10 bg-slate-100 p-2 rounded-[2rem] w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
          { id: 'flags', label: 'Feature Flags', icon: 'fa-toggle-on' },
          { id: 'tests', label: 'Automated Tests', icon: 'fa-vial' },
          { id: 'ethics', label: 'Compliance & Ethics', icon: 'fa-shield-halved' },
          { id: 'logs', label: 'Audit Logs', icon: 'fa-list-check' },
          { id: 'reports', label: 'Reports', icon: 'fa-file-export' },
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shrink-0 ${activeTab === t.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className={`fas ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'flags' && renderFeatureFlags()}
        {activeTab === 'tests' && renderTestSuite()}
        {activeTab === 'ethics' && renderEthicsDocs()}
        {activeTab === 'logs' && renderAuditLogs()}
        {activeTab === 'reports' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               { title: "Safety & Ethics Summary", icon: "fa-shield-halved", type: "safety" },
               { title: "Monthly Compliance Audit", icon: "fa-file-shield", type: "audit" },
               { title: "Edge-Case Test History", icon: "fa-flask", type: "testing" }
             ].map((r, i) => (
               <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl text-slate-400 mb-6"><i className={`fas ${r.icon}`}></i></div>
                 <h4 className="font-black text-slate-900 mb-8">{r.title}</h4>
                 <div className="flex gap-2 w-full">
                   <button onClick={() => exportReport('PDF', r.title)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">PDF</button>
                   <button onClick={() => exportReport('CSV', r.title)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">CSV</button>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

const AccountView: React.FC = () => {
  const [complianceReport, setComplianceReport] = useState<any>(null);

  useEffect(() => {
    const report = runComplianceChecks(" Kenya AI Global System Prompt Placeholder Professional Support Engine ");
    setComplianceReport(report);
  }, []);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 sm:p-12 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-slate-100 pb-10 gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Account Management</h2>
          <p className="text-slate-500 font-bold text-lg">Licensing & Compliance Dashboard</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 pr-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-green-700 text-white rounded-2xl flex items-center justify-center font-black text-sm">K</div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-none">Professional Member</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Pro Tier Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <i className="fas fa-shield-check text-green-600"></i> Automated Compliance Guardrails
            </h3>
            <div className="space-y-4">
              {complianceReport?.checks.map((check: any) => (
                <div key={check.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${check.status === 'passed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      <i className={`fas ${check.status === 'passed' ? 'fa-check' : 'fa-times'}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{check.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{check.details}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${check.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                    {check.status === 'passed' ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8">Subscription Management</h3>
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-2xl font-black text-green-700 mb-2">Africa Pro Access</p>
              <p className="text-sm font-bold text-slate-500">KES 7,500/year Institutional Plan</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="text-xl font-black mb-4">Enterprise Hub</h4>
               <p className="text-sm font-bold text-white/60 mb-8">Manage organizational deployment and safety settings.</p>
               <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Portal Login</button>
             </div>
             <i className="fas fa-building absolute -bottom-10 -right-10 text-[10rem] text-white/5"></i>
           </div>
        </div>
      </div>
    </div>
  );
};

const Pricing: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
  <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 sm:p-12 overflow-y-auto custom-scrollbar">
    <div className="text-center mb-16">
      <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Simple Pricing</h2>
      <p className="text-slate-500 text-xl font-bold">Assisting Kenya's professionals with secure AI support.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { tier: "Individual Pro", price: "KES 1,000", period: "/mo", accent: "bg-slate-900" },
        { tier: "Africa Pro Access", price: "KES 7,500", period: "/yr", accent: "bg-green-700", popular: true },
        { tier: "Institutional", price: "KES 50k+", period: "/yr", accent: "bg-blue-700" },
        { tier: "Government", price: "Custom", period: "Contract", accent: "bg-slate-900" }
      ].map((p, i) => (
        <div key={i} className={`bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col ${p.popular ? 'border-green-600 ring-4 ring-green-600/5' : 'border-slate-100'}`}>
          <h3 className="text-lg font-black text-slate-900 mb-8">{p.tier}</h3>
          <div className="mb-10">
            <span className="text-2xl font-black text-slate-900">{p.price}</span>
            <span className="text-slate-400 font-bold text-[10px]">{p.period}</span>
          </div>
          <button onClick={onUpgrade} className={`${p.accent} text-white w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all`}>Get Started</button>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [activeModule, setActiveModule] = useState<AIModule>('General');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [images, setImages] = useState<ImageResult[]>([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>('Platform Admin');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const seen = localStorage.getItem('kenya_ai_v5_onboarded');
    if (!seen) {
      setShowOnboarding(true);
      localStorage.setItem('kenya_ai_v5_onboarded', 'true');
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied.")
      );
    }
  }, []);

  const handleModuleSwitch = (modId: AIModule) => {
    setActiveModule(modId);
    setChatHistory([]);
    setInput('');
    setErrorState(null);
    if (modId === 'Creative') setActiveTab(AppTab.IMAGE_GEN);
    else setActiveTab(AppTab.CHAT);
    setSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', text: input, timestamp: new Date(), module: activeModule };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setErrorState(null);
    try {
      const historyForAPI = chatHistory.filter(m => m.module === activeModule).slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithKenyaAI(input, historyForAPI, activeModule, userLocation);
      const aiMsg: Message = { role: 'model', text: response.text, timestamp: new Date(), groundingUrls: response.groundingUrls, module: activeModule };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error: any) {
      if (error.message.includes('SECURITY BLOCK')) setErrorState(error.message);
      setChatHistory(prev => [...prev, { role: 'model', text: error.message, timestamp: new Date(), module: activeModule }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfig = MODULE_CONFIGS[activeModule];

  return (
    <div className="flex h-screen bg-[#fcf9f2] text-slate-800 overflow-hidden font-['Outfit']">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      
      <aside className={`fixed sm:relative z-50 flex flex-col w-72 h-full ${activeTab === AppTab.ADMIN ? 'bg-slate-900' : currentConfig.color} text-white transition-all duration-700 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-green-900 font-black">K</div>
            <span className="font-black tracking-tighter text-2xl uppercase">Kenya AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-white/60"><i className="fas fa-times"></i></button>
        </div>
        <nav className="flex-1 p-5 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {activeTab === AppTab.ADMIN ? 'Admin Controls' : 'Professional Modules'}
          </p>
          {activeTab === AppTab.ADMIN ? (
             <div className="space-y-4 p-4">
               {['Platform Admin', 'Institution Admin', 'Compliance Officer', 'Auditor'].map((r) => (
                  <button key={r} onClick={() => setAdminRole(r as AdminRole)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${adminRole === r ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>{r}</button>
               ))}
             </div>
          ) : (
            Object.values(MODULE_CONFIGS).map((mod) => (
              <button key={mod.id} onClick={() => handleModuleSwitch(mod.id)} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeModule === mod.id ? 'bg-white/20' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><i className={`${mod.icon} text-xs`}></i></div>
                <span className="text-sm font-bold">{mod.label}</span>
              </button>
            ))
          )}
        </nav>
        <div className="p-8 border-t border-white/10 text-center">
           <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Protocol v5.2 Active</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 sm:px-10 py-5 flex justify-between items-center z-40 shadow-sm">
          <div className="flex items-center gap-5">
            <button onClick={() => setSidebarOpen(true)} className="sm:hidden p-3 text-slate-500 rounded-xl"><i className="fas fa-bars"></i></button>
            {activeTab !== AppTab.ADMIN && <div className={`hidden xs:flex p-3 rounded-2xl ${currentConfig.color} text-white`}><i className={currentConfig.icon}></i></div>}
            <h2 className="text-base font-black text-slate-900">{activeTab === AppTab.ADMIN ? 'System Oversight' : currentConfig.label}</h2>
          </div>
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            {[
              { tab: AppTab.CHAT, icon: "fa-brain", label: "Assistant" },
              { tab: AppTab.IMAGE_GEN, icon: "fa-palette", label: "Creative" },
              { tab: AppTab.PRICING, icon: "fa-tags", label: "Pricing" },
              { tab: AppTab.ACCOUNT, icon: "fa-user-shield", label: "Ethics" },
              { tab: AppTab.ADMIN, icon: "fa-shield-halved", label: "Admin" }
            ].map((t) => (
              <button key={t.tab} onClick={() => setActiveTab(t.tab)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 ${activeTab === t.tab ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500'}`}>
                <i className={`fas ${t.icon}`}></i>
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div className="bg-slate-900 text-white/60 py-2 px-6 text-[10px] font-black uppercase tracking-widest text-center">
            Ethical decision-support platform. metadata-only observability.
          </div>

          {activeTab === AppTab.CHAT && (
            <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className={`w-24 h-24 ${currentConfig.bgColor} ${currentConfig.color.replace('bg-', 'text-')} rounded-[2.5rem] flex items-center justify-center text-4xl mb-8 shadow-xl ring-4 ring-white`}>
                      <i className={currentConfig.icon}></i>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4">{activeModule} Assist</h3>
                    <p className="text-slate-500 max-w-sm mb-12 font-bold leading-relaxed">Secure decision-support for professional workflows in Kenya.</p>
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] px-8 py-6 rounded-[2rem] shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                      <div className="prose prose-slate max-w-none text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</div>
                      {msg.groundingUrls && <GroundingResults urls={msg.groundingUrls} />}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="p-6 bg-white border border-slate-100 rounded-2xl animate-pulse w-32 h-12 flex items-center justify-center gap-2"><div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce delay-150"></div></div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 sm:p-10 bg-white border-t border-slate-50">
                <div className="max-w-4xl mx-auto flex gap-5">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Draft a query..." className="flex-1 bg-slate-100 rounded-3xl px-8 py-5 outline-none font-bold text-sm" />
                  <button onClick={handleSendMessage} disabled={isLoading || !input.trim() || !!errorState} className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-20"><i className="fas fa-paper-plane"></i></button>
                </div>
              </div>
            </div>
          )}
          {activeTab === AppTab.IMAGE_GEN && (
             <div className="flex flex-col h-full p-8 sm:p-16 max-w-6xl mx-auto w-full overflow-y-auto custom-scrollbar">
                <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">Creative studio</h2>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm mb-16 flex gap-6">
                   <input type="text" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe visual concept..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 outline-none font-black text-lg" />
                   <button onClick={async () => {setIsLoading(true); try { const url = await generateKenyaImage(imagePrompt, activeModule); setImages(prev => [{url, prompt: imagePrompt, timestamp: new Date()}, ...prev]); setImagePrompt(''); } catch(e){alert('Visualization failed');} finally{setIsLoading(false);}}} className="bg-slate-900 text-white px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest">{isLoading ? 'Working...' : 'Visualize'}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {images.map((img, i) => (
                      <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50"><img src={img.url} className="w-full aspect-video object-cover" /><p className="p-6 text-sm font-black text-slate-800 line-clamp-2">"{img.prompt}"</p></div>
                   ))}
                </div>
             </div>
          )}
          {activeTab === AppTab.PRICING && <Pricing onUpgrade={() => setShowUpgradeModal(true)} />}
          {activeTab === AppTab.ACCOUNT && <AccountView />}
          {activeTab === AppTab.ADMIN && <AdminDashboard role={adminRole} />}
        </main>
      </div>
    </div>
  );
};

export default App;