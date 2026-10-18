import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  FileText,
  User,
  Building,
  AlertCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { GeneratedCertificateModal } from '../common/GeneratedCertificateModal';
import { ServiceRequest, UploadedFile } from '../../types';

export const ApproverDashboard: React.FC = () => {
  const {
    currentUser,
    requests,
    approveRequest,
    rejectRequest,
    requestAdditionalInfo,
    setActiveTab,
  } = useApp();

  if (!currentUser) return null;

  // Requests requiring decision: Pending Approval or Verified
  const pendingApprovals = useMemo(() => {
    return requests.filter(
      (r) => r.status === 'Pending Approval' || r.status === 'Verified'
    );
  }, [requests]);

  const approvedList = useMemo(() => {
    return requests.filter((r) => r.status === 'Approved' || r.status === 'Completed');
  }, [requests]);

  const rejectedList = useMemo(() => {
    return requests.filter((r) => r.status === 'Rejected');
  }, [requests]);

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    pendingApprovals[0] || null
  );

  const [inspectingFile, setInspectingFile] = useState<UploadedFile | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-select first request if none selected
  React.useEffect(() => {
    if (!selectedRequest && pendingApprovals.length > 0) {
      setSelectedRequest(pendingApprovals[0]);
    }
  }, [pendingApprovals, selectedRequest]);

  // Sync decision remarks default
  React.useEffect(() => {
    if (selectedRequest) {
      setDecisionRemarks(
        `Endorsed and approved according to university academic regulations. Validated by ${currentUser.name}.`
      );
    }
  }, [selectedRequest?.id, currentUser?.name]);

  const handleApprove = () => {
    if (!selectedRequest) return;
    if (!decisionRemarks.trim()) {
      alert('Mandatory: Please enter decision remarks.');
      return;
    }
    setIsProcessing(true);
    approveRequest(selectedRequest.id, decisionRemarks, true);
    setIsProcessing(false);
    alert(`Request ${selectedRequest.id} has been Approved and Issued! Certificate is now generated.`);
    setSelectedRequest(null);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    if (!decisionRemarks.trim()) {
      alert('Mandatory: Please provide a clear justification for rejection.');
      return;
    }
    setIsProcessing(true);
    rejectRequest(selectedRequest.id, decisionRemarks);
    setIsProcessing(false);
    alert(`Request ${selectedRequest.id} has been rejected with justification.`);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Approving Authority Desk
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700">
                {currentUser.designation || 'Dean of Academic Affairs'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Executive Endorsement: {currentUser?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review verified requests, inspect department audit remarks, and grant official institutional endorsement.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('approver-history')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
          >
            <span>Decision Audit Trail</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/70">
            <div className="flex items-center justify-between text-violet-800 mb-1">
              <span className="text-xs font-semibold">Pending Decisions</span>
              <Clock className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-2xl font-bold text-violet-950">{pendingApprovals.length}</div>
            <div className="text-[11px] text-violet-700">Verified by department staff</div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/70">
            <div className="flex items-center justify-between text-teal-800 mb-1">
              <span className="text-xs font-semibold">Approved Requests</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-950">{approvedList.length}</div>
            <div className="text-[11px] text-teal-700">Officially certified</div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <div className="flex items-center justify-between text-rose-800 mb-1">
              <span className="text-xs font-semibold">Rejected Requests</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-950">{rejectedList.length}</div>
            <div className="text-[11px] text-rose-700">With documented reasons</div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Pending Queue (4 cols) & Right Decision Desk (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Pending Decisions Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Requests Queue ({pendingApprovals.length})
              </h2>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-teal-500/80" />
                <p className="text-xs font-semibold text-slate-700">All Clear!</p>
                <p className="text-[11px] text-slate-400">
                  No verified requests are waiting for decision right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingApprovals.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {req.id}
                        </span>
                        <StatusBadge status={req.status} size="sm" />
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        {req.serviceName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Applicant: <strong>{req.studentName}</strong> ({req.studentRoll})
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Verified by {req.assignedStaffName || 'Staff'}</span>
                        <span>{new Date(req.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Decision Desk Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRequest ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
              {/* Request Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-950">
                    <span>{selectedRequest.id}</span>
                    <span>·</span>
                    <span>{selectedRequest.serviceCode}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedRequest.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student: <strong>{selectedRequest.studentName}</strong> · Roll: {selectedRequest.studentRoll} · {selectedRequest.studentDepartment}
                  </p>
                </div>

                <StatusBadge status={selectedRequest.status} size="md" />
              </div>

              {/* Staff Verification Audit Trail */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Department Staff Verification Audit Record</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded border border-amber-200/50">
                  &ldquo;{selectedRequest.verificationRemarks || 'Verified active semester enrollment, fee receipt reconciliation, and absence clearance.'}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-amber-800 pt-1">
                  <span>Auditor: {selectedRequest.assignedStaffName || 'Verification Officer'}</span>
                  <span className="font-mono">{new Date(selectedRequest.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Form Details Review */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] uppercase font-bold text-slate-400">
                  Applicant Stated Details
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60">
                  {Object.entries(selectedRequest.formData).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-400 capitalize">{k}:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{v || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Checklist with Direct Inspection */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] uppercase font-bold text-slate-400">
                  Verified Attachments ({selectedRequest.uploadedDocuments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRequest.uploadedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{doc.docName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                      </div>
                      <button
                        onClick={() => setInspectingFile(doc)}
                        className="text-xs text-indigo-700 hover:text-indigo-950 font-semibold inline-flex items-center gap-1 shrink-0 ml-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Decision Panel */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Approver Authority Remarks (Mandatory for Official Seal)
                  </label>
                  <textarea
                    rows={3}
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    placeholder="Enter formal endorsement remarks to be imprinted on the certificate..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
                  />
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleReject}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    Reject with Remarks
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Issue Official Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Request Selected</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select a verified request from the left queue to review and endorse.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(inspectingFile)}
        file={inspectingFile}
        onClose={() => setInspectingFile(null)}
        studentName={selectedRequest?.studentName}
        studentRoll={selectedRequest?.studentRoll}
      />
    </div>
  );
};
