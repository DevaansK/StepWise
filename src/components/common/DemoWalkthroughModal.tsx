import React from 'react';
import { X, CheckCircle, ArrowRight, RotateCcw, UserCheck, Shield, Sparkles, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoWalkthroughModal: React.FC = () => {
  const {
    isWalkthroughOpen,
    setIsWalkthroughOpen,
    switchRole,
    setActiveTab,
    resetToDefaultData,
  } = useApp();

  if (!isWalkthroughOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-800 text-teal-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                StepWise Faculty Demonstration Guide
              </h3>
              <p className="text-xs text-indigo-200">
                End-to-End Workflow Demonstration & Role Switcher
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWalkthroughOpen(false)}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Executive Overview */}
          <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            <strong>Prototype Scenario:</strong> StepWise connects 4 college roles (Student, Department Staff, Approving Authority, Admin) over a single centralized data model. Any state update immediately propagates across all dashboards.
          </div>

          {/* Core Demo Pathway 1: End-to-End Bonafide Approval */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pathway 1: Complete Service Approval Workflow
            </h4>
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      Student Applies for Bonafide Certificate
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Log in as <strong>Alex Chen</strong>. Browse Services &gt; click &quot;Start Request&quot; on Bonafide Certificate &gt; enter purpose &gt; attach student ID &amp; fee receipt &gt; Submit to get unique ID.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    switchRole('STUDENT');
                    setActiveTab('new-request', 'srv-bonafide');
                    setIsWalkthroughOpen(false);
                  }}
                  className="shrink-0 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span>Go to Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      Department Staff Verifies Documents
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch to <strong>Dr. Meera Patel</strong> (Academic Affairs). Open request <code className="text-indigo-600 font-mono">SW-2026-0004</code> &gt; inspect documents in viewer &gt; click &quot;Verify Documents &amp; Forward to Dean&quot;.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    switchRole('STAFF');
                    setActiveTab('staff-verification', 'SW-2026-0004');
                    setIsWalkthroughOpen(false);
                  }}
                  className="shrink-0 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span>Go to Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      Approving Authority Endorses Request
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch to <strong>Prof. Robert Vance</strong> (Dean). Review verified request in Pending Approvals &gt; enter decision remarks &gt; click &quot;Approve &amp; Issue Certificate&quot;.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    switchRole('APPROVER');
                    setActiveTab('approver-pending');
                    setIsWalkthroughOpen(false);
                  }}
                  className="shrink-0 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span>Go to Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      Student Tracks Timeline &amp; Views Certificate
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch back to <strong>Alex Chen</strong>. Notification received! Open My Requests &gt; view complete vertical tracking timeline &gt; click &quot;View / Print Official Certificate&quot;.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    switchRole('STUDENT');
                    setActiveTab('request-detail', 'SW-2026-0004');
                    setIsWalkthroughOpen(false);
                  }}
                  className="shrink-0 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span>Go to Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Pathway 2: Additional Info Required */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pathway 2: Additional Information Query &amp; Student Response
            </h4>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start justify-between gap-3">
              <div>
                <h5 className="text-xs font-semibold text-amber-950">
                  Pre-configured Query: Academic Transcript (SW-2026-0003)
                </h5>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Staff requested a missing Library Clearance slip. As student Alex Chen, open the request, upload the document in the response box, and click &quot;Resubmit Information&quot; to restore status to <em>Under Verification</em>.
                </p>
              </div>
              <button
                onClick={() => {
                  switchRole('STUDENT');
                  setActiveTab('request-detail', 'SW-2026-0003');
                  setIsWalkthroughOpen(false);
                }}
                className="shrink-0 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
              >
                <span>Open Request</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Pathway 3: AI Assistant */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pathway 3: AI College Administrative Assistant
            </h4>
            <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 flex items-start justify-between gap-3">
              <div>
                <h5 className="text-xs font-semibold text-teal-950">
                  Ask StepWise AI Advisor
                </h5>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Ask about required documents, procedures, office rooms, and deadlines. Powered by Gemini API with seamless local knowledge fallback and actionable start-request buttons.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('assistant');
                  setIsWalkthroughOpen(false);
                }}
                className="shrink-0 text-xs font-medium text-teal-900 bg-teal-100 hover:bg-teal-200 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
              >
                <span>Open Assistant</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              if (confirm('Reset all demo data back to default sample state?')) {
                resetToDefaultData();
                setIsWalkthroughOpen(false);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={() => setIsWalkthroughOpen(false)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-950 hover:bg-indigo-900 rounded-lg transition-colors"
          >
            Got it, Let&apos;s Explore
          </button>
        </div>
      </div>
    </div>
  );
};
