import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Grid,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const { requests, services, departments, users, setActiveTab, resetToDefaultData } =
    useApp();

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) =>
      r.status === 'Submitted' ||
      r.status === 'Under Verification' ||
      r.status === 'Additional Information Required' ||
      r.status === 'Pending Approval' ||
      r.status === 'Verified'
  ).length;
  const completedRequests = requests.filter((r) => r.status === 'Completed').length;
  const completionRate = totalRequests
    ? Math.round((completedRequests / totalRequests) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>StepWise Institutional Administration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Campus Service System Overview
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor institutional request flow across departments, manage service catalogues and document requirements, maintain routing rules, and audit resolution metrics.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total System Requests</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalRequests}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all college departments</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-amber-700">Active Workflows</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingRequests}</div>
          <div className="text-[11px] text-slate-400 mt-1">Under verification or approval</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-emerald-700">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{completionRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {completedRequests} certificates issued
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-indigo-700">Configured Services</span>
            <Grid className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{services.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {departments.length} assigned departments
          </div>
        </div>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('admin-requests')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 w-fit mb-3 group-hover:bg-indigo-100 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">All Requests Master</h3>
          <p className="text-xs text-slate-500 mt-1">
            Filter, inspect, and track requests across all college units.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('admin-services')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 w-fit mb-3 group-hover:bg-teal-100 transition-colors">
            <Grid className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Service Catalogue</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add or edit services, update document checklists &amp; turnarounds.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('admin-departments')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 w-fit mb-3 group-hover:bg-amber-100 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Departments Directory</h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic and administrative departments and offices.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('admin-reports')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 w-fit mb-3 group-hover:bg-blue-100 transition-colors">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Reports &amp; Analytics</h3>
          <p className="text-xs text-slate-500 mt-1">
            Processing SLA metrics, department volume, and resolution rates.
          </p>
        </button>
      </div>

      {/* Recent Requests Master Log */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Campus Requests Stream</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time submission ledger across all 4 roles
            </p>
          </div>

          <button
            onClick={() => setActiveTab('admin-requests')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors inline-flex items-center gap-1"
          >
            <span>Master View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Request ID</th>
                <th className="px-6 py-3">Applicant Student</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.slice(0, 6).map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setActiveTab('request-detail', req.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                    {req.id}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-semibold text-slate-900">{req.studentName}</span>
                    <span className="text-slate-400 font-mono ml-2">({req.studentRoll})</span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">
                    {req.serviceName}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {req.assignedDepartmentId}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-indigo-700">
                    Inspect
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
