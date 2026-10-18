import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Award,
  Search,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { GeneratedCertificateModal } from '../common/GeneratedCertificateModal';
import { ServiceRequest } from '../../types';

export const ApproverHistoryView: React.FC = () => {
  const { requests, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingCertRequest, setInspectingCertRequest] = useState<ServiceRequest | null>(null);

  // Filter requests that reached a terminal decision
  const decidedRequests = requests.filter(
    (r) => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Rejected'
  );

  const filtered = decidedRequests.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.decisionRemarks && r.decisionRemarks.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('approver-pending')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pending Approvals</span>
        </button>

        <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          {decidedRequests.length} Decided Records
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Approving Authority Decision History &amp; Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical log of all executive endorsements, certifications, and rejections.
          </p>
        </div>

        {/* Search */}
        <div className="pt-2">
          <input
            type="text"
            placeholder="Search by student, request ID, service, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-96 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Decision Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Request ID</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Service</th>
                <th className="px-6 py-3.5">Decision Date</th>
                <th className="px-6 py-3.5">Outcome</th>
                <th className="px-6 py-3.5">Executive Remarks</th>
                <th className="px-6 py-3.5 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No decision records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {req.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.studentRoll}</div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {req.serviceName}
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {new Date(req.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      {req.decisionRemarks || 'Endorsed'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {req.status === 'Approved' || req.status === 'Completed' ? (
                        <button
                          onClick={() => setInspectingCertRequest(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Certificate Modal */}
      <GeneratedCertificateModal
        isOpen={Boolean(inspectingCertRequest)}
        request={inspectingCertRequest}
        onClose={() => setInspectingCertRequest(null)}
      />
    </div>
  );
};
