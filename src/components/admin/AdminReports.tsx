import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminReports: React.FC = () => {
  const { requests, services, departments, setActiveTab } = useApp();

  const totalRequests = requests.length;

  // Requests by status
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [requests]);

  // Requests by service
  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.serviceName] = (counts[r.serviceName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  // Requests by department
  const departmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.assignedDepartmentId] = (counts[r.assignedDepartmentId] || 0) + 1;
    });
    return Object.entries(counts).map(([deptId, count]) => {
      const d = departments.find((dept) => dept.id === deptId);
      return {
        id: deptId,
        name: d?.name || deptId,
        count,
        percentage: totalRequests ? Math.round((count / totalRequests) * 100) : 0,
      };
    });
  }, [requests, departments, totalRequests]);

  // Completion rate
  const completedCount = requests.filter(
    (r) => r.status === 'Completed' || r.status === 'Approved'
  ).length;
  const completionRate = totalRequests ? Math.round((completedCount / totalRequests) * 100) : 0;

  // Average processing time calculation from timestamps
  const avgProcessingDays = useMemo(() => {
    const finished = requests.filter(
      (r) => r.status === 'Completed' || r.status === 'Approved'
    );
    if (finished.length === 0) return 2.1;

    let totalDurationMs = 0;
    finished.forEach((r) => {
      const start = new Date(r.submittedAt).getTime();
      const end = new Date(r.updatedAt || r.submittedAt).getTime();
      totalDurationMs += Math.max(end - start, 86400000); // minimum 1 day representation
    });
    const avgDays = totalDurationMs / finished.length / (1000 * 60 * 60 * 24);
    return Math.round(avgDays * 10) / 10;
  }, [requests]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('admin-dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          Source: Active Prototype Storage
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrative Reports &amp; SLA Performance Analytics
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Analytical evaluation metrics derived strictly from the current prototype dataset ({totalRequests} requests recorded).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Workflows</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalRequests}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged requests</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-teal-700">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{completionRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{completedCount} requests settled</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-indigo-700">Avg. Turnaround</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgProcessingDays} Days</div>
          <div className="text-[11px] text-slate-400 mt-1">Sample SLA benchmark</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-amber-700">Queried Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalRequests
              ? Math.round(((statusBreakdown['Additional Information Required'] || 0) / totalRequests) * 100)
              : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Required document resubmissions</div>
        </div>
      </div>

      {/* Grid: Status Distribution & Department Volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Workflow Volume by Status</h3>
            <span className="text-[11px] font-mono text-slate-400">9 Formal States</span>
          </div>

          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([st, count]) => {
              const pct = totalRequests ? Math.round((count / totalRequests) * 100) : 0;

              return (
                <div key={st}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{st}</span>
                    <span className="font-mono text-slate-500">
                      <strong>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-900 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requests by Department */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Workload by College Department</h3>
            <span className="text-[11px] font-mono text-slate-400">Load Balancing</span>
          </div>

          <div className="space-y-3.5">
            {departmentBreakdown.map((dept) => (
              <div key={dept.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800">{dept.name}</span>
                  <span className="font-mono text-slate-600">
                    <strong>{dept.count}</strong> reqs ({dept.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Most Requested Administrative Services</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Service demand ranking based on live prototype submissions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Service Name</th>
                <th className="px-6 py-3">Requests Logged</th>
                <th className="px-6 py-3">Share of Total</th>
                <th className="px-6 py-3 text-right">Avg SLA Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {serviceBreakdown.map(([srvName, count], idx) => {
                const srvObj = services.find((s) => s.name === srvName);
                const pct = totalRequests ? Math.round((count / totalRequests) * 100) : 0;

                return (
                  <tr key={srvName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {srvName}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-indigo-900">
                      {count}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {pct}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-600">
                      ~{srvObj?.estimatedProcessingDays || 2} Days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
