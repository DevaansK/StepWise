import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Bot,
  Grid,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    requests,
    notifications,
    setActiveTab,
    setIsWalkthroughOpen,
  } = useApp();

  // Filter requests belonging to this student
  const studentRequests = requests.filter((r) => r.studentId === currentUser.id);

  // Exact calculated statistics from prototype data
  const totalCount = studentRequests.length;
  const pendingCount = studentRequests.filter(
    (r) =>
      r.status === 'Submitted' ||
      r.status === 'Under Verification' ||
      r.status === 'Additional Information Required' ||
      r.status === 'Pending Approval' ||
      r.status === 'Verified'
  ).length;
  const approvedCount = studentRequests.filter((r) => r.status === 'Approved').length;
  const completedCount = studentRequests.filter((r) => r.status === 'Completed').length;

  // Alerts: requests requiring additional documents/information
  const actionRequiredRequests = studentRequests.filter(
    (r) => r.status === 'Additional Information Required'
  );

  // Calculate status breakdown for progress bars
  const statusCounts = {
    submitted: studentRequests.filter((r) => r.status === 'Submitted').length,
    underVerification: studentRequests.filter(
      (r) => r.status === 'Under Verification' || r.status === 'Verified'
    ).length,
    pendingApproval: studentRequests.filter((r) => r.status === 'Pending Approval').length,
    approvedCompleted: studentRequests.filter(
      (r) => r.status === 'Approved' || r.status === 'Completed'
    ).length,
    rejected: studentRequests.filter((r) => r.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Academic Session 2025-2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Discover college administrative services, track your official clearance requests, submit documents digitally, and resolve departmental queries without office queues.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('new-request')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Service Request</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors"
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span>Ask AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Decorative corner graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <ShieldCheck className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Missing Document / Action Required Alert Banner */}
      {actionRequiredRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Action Required: Incomplete Documents ({actionRequiredRequests.length} request)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Department staff reviewed request{' '}
                <strong className="font-mono text-amber-950">
                  {actionRequiredRequests[0].id}
                </strong>{' '}
                ({actionRequiredRequests[0].serviceName}) and requested missing files:{' '}
                <em>&ldquo;{actionRequiredRequests[0].additionalInfoQuery}&rdquo;</em>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('request-detail', actionRequiredRequests[0].id)}
            className="shrink-0 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Upload Missing Info</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Stat Cards (Strictly calculated from prototype data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Total Requests</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Submitted through StepWise</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-amber-700">In Progress</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verification &amp; Dean approval</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-teal-700">Approved</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Endorsed by Authority</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-emerald-700">Completed</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Issued &amp; ready to print</div>
        </div>
      </div>

      {/* Main Grid: Recent Requests & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Service Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of your administrative submissions
              </p>
            </div>
            <button
              onClick={() => setActiveTab('my-requests')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Request ID</th>
                  <th className="px-6 py-3">Service Name</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No service requests submitted yet. Click &ldquo;New Service Request&rdquo; to begin.
                    </td>
                  </tr>
                ) : (
                  studentRequests.slice(0, 5).map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setActiveTab('request-detail', req.id)}
                    >
                      <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">
                        {req.id}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-slate-900 group-hover:text-indigo-900 transition-colors">
                          {req.serviceName}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(req.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('request-detail', req.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Request Status Distribution & Quick Links */}
        <div className="space-y-6">
          {/* Status Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Request Status Distribution
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Submitted &amp; In Queue</span>
                  <span className="font-mono font-bold text-slate-900">{statusCounts.submitted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalCount ? `${(statusCounts.submitted / totalCount) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Under Verification</span>
                  <span className="font-mono font-bold text-slate-900">{statusCounts.underVerification}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalCount
                        ? `${(statusCounts.underVerification / totalCount) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Pending Dean Approval</span>
                  <span className="font-mono font-bold text-slate-900">{statusCounts.pendingApproval}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalCount
                        ? `${(statusCounts.pendingApproval / totalCount) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Approved &amp; Completed</span>
                  <span className="font-mono font-bold text-slate-900">
                    {statusCounts.approvedCompleted}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalCount
                        ? `${(statusCounts.approvedCompleted / totalCount) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Resolution Rate:</span>
              <span className="font-semibold text-emerald-700">
                {totalCount ? Math.round((statusCounts.approvedCompleted / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Quick Service Portals */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Portals
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('services')}
                className="p-3 text-left rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
              >
                <Grid className="w-4 h-4 text-indigo-700 mb-1.5" />
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-indigo-950">
                  Service Catalogue
                </span>
                <span className="text-[10px] text-slate-500">8 Services</span>
              </button>

              <button
                onClick={() => setActiveTab('assistant')}
                className="p-3 text-left rounded-lg border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/40 transition-colors group"
              >
                <Bot className="w-4 h-4 text-teal-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-teal-950">
                  AI Advisor
                </span>
                <span className="text-[10px] text-slate-500">Procedures Q&amp;A</span>
              </button>

              <button
                onClick={() => setActiveTab('my-requests')}
                className="p-3 text-left rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
              >
                <FileText className="w-4 h-4 text-slate-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-slate-950">
                  My Requests
                </span>
                <span className="text-[10px] text-slate-500">Track Status</span>
              </button>

              <button
                onClick={() => setIsWalkthroughOpen(true)}
                className="p-3 text-left rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-indigo-950">
                  Demo Guide
                </span>
                <span className="text-[10px] text-slate-500">Test All 4 Roles</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
