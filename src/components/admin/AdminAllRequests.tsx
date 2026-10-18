import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, ArrowLeft, Building, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';

export const AdminAllRequests: React.FC = () => {
  const { requests, departments, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesDept = deptFilter === 'all' || r.assignedDepartmentId === deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [requests, searchQuery, statusFilter, deptFilter]);

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
          {requests.length} Total Institutional Requests
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            All Institutional Requests Master Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative oversight across Academic Affairs, Controller of Examinations, Finance, Housing, and Security.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, student roll no, or service name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">All Request Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Additional Information Required">Additional Info Required</option>
              <option value="Verified">Verified</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Request ID</th>
                <th className="px-6 py-3.5">Student / Roll</th>
                <th className="px-6 py-3.5">Service Name</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Submitted</th>
                <th className="px-6 py-3.5">Current Status</th>
                <th className="px-6 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setActiveTab('request-detail', req.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 group-hover:text-indigo-900">
                    {req.id}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">{req.studentName}</span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {req.studentRoll}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-800">
                    {req.serviceName}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {departments.find((d) => d.id === req.assignedDepartmentId)?.name || req.assignedDepartmentId}
                  </td>

                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    {new Date(req.submittedAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} size="sm" />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('request-detail', req.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
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
