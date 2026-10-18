import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  User,
  Building,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';

export const StaffDashboard: React.FC = () => {
  const { currentUser, requests, departments, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const dept = departments.find((d) => d.id === currentUser.departmentId);

  // Filter requests strictly assigned to staff member's department
  const deptRequests = useMemo(() => {
    return requests.filter((r) => r.assignedDepartmentId === currentUser.departmentId);
  }, [requests, currentUser.departmentId]);

  // Calculated department metrics
  const totalAssigned = deptRequests.length;
  const awaitingVerification = deptRequests.filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Verification'
  ).length;
  const incompleteCount = deptRequests.filter(
    (r) => r.status === 'Additional Information Required'
  ).length;
  const verifiedCount = deptRequests.filter(
    (r) =>
      r.status === 'Verified' ||
      r.status === 'Pending Approval' ||
      r.status === 'Approved' ||
      r.status === 'Completed'
  ).length;

  const filteredRequests = useMemo(() => {
    return deptRequests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deptRequests, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Department Staff Portal
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700">
                {dept?.name || 'Department Desk'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Verification Desk: {currentUser.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify student documents, log audit remarks, query missing files, and forward verified requests to the Approving Authority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Assigned Dept: <strong>{dept?.code}</strong>
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Department Requests</span>
              <FileCheck2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalAssigned}</div>
            <div className="text-[11px] text-slate-400">Assigned to {dept?.code}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-semibold">Awaiting Verification</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">{awaitingVerification}</div>
            <div className="text-[11px] text-amber-700">Needs staff file check</div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70">
            <div className="flex items-center justify-between text-rose-800 mb-1">
              <span className="text-xs font-semibold">Incomplete / Queried</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-950">{incompleteCount}</div>
            <div className="text-[11px] text-rose-700">Awaiting student response</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-semibold">Verified / Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">{verifiedCount}</div>
            <div className="text-[11px] text-emerald-700">Endorsed &amp; processed</div>
          </div>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, student, roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">All Department Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Additional Information Required">Additional Info Required</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Request ID</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No requests found in this department queue.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setActiveTab('staff-verification', req.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 group-hover:text-indigo-900">
                      {req.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.studentRoll}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{req.serviceName}</span>
                      <div className="text-[11px] text-slate-400">{req.uploadedDocuments.length} files attached</div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {new Date(req.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('staff-verification', req.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Inspect &amp; Verify</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
