import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  User,
  Clock,
  Building,
  Eye,
  Shield,
  Send,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { UploadedFile } from '../../types';

export const StaffVerificationView: React.FC = () => {
  const {
    currentUser,
    requests,
    selectedRequestId,
    setSelectedRequestId,
    departments,
    verifyDocuments,
    requestAdditionalInfo,
    setActiveTab,
  } = useApp();

  if (!currentUser) return null;

  // Filter department requests
  const deptRequests = requests.filter(
    (r) => r.assignedDepartmentId === currentUser.departmentId
  );

  // Current request being verified
  const activeRequest =
    requests.find((r) => r.id === selectedRequestId) ||
    deptRequests.find((r) => r.status === 'Submitted' || r.status === 'Under Verification') ||
    deptRequests[0];

  const [inspectingFile, setInspectingFile] = useState<UploadedFile | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [queryText, setQueryText] = useState<string>('');
  const [activeActionTab, setActiveActionTab] = useState<'verify' | 'query'>('verify');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (activeRequest) {
      setRemarks(
        activeRequest.verificationRemarks ||
          'Enrolled student records verified. Fee payment reconciled with college ledger.'
      );
      setQueryText('');
    }
  }, [activeRequest?.id]);

  if (!activeRequest) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Requests in Department Queue</h3>
        <p className="text-xs text-slate-500 mt-1">All assigned requests have been processed.</p>
        <button
          onClick={() => setActiveTab('staff-assigned')}
          className="mt-3 px-4 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Cross-department permission guard
  const isAuthorizedDept = activeRequest.assignedDepartmentId === currentUser.departmentId;

  const handleVerify = async () => {
    if (!isAuthorizedDept) {
      alert('Unauthorized: You can only process requests assigned to your department.');
      return;
    }
    if (!remarks.trim()) {
      alert('Please enter verification remarks for the official audit log.');
      return;
    }
    setIsProcessing(true);
    try {
      await verifyDocuments(activeRequest.id, remarks, true);
      alert(`Request ${activeRequest.id} verified and forwarded to Approving Authority!`);
      setActiveTab('staff-assigned');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'The request could not be updated. Refresh and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!isAuthorizedDept) {
      alert('Unauthorized: You can only process requests assigned to your department.');
      return;
    }
    if (!queryText.trim()) {
      alert('Please enter a mandatory explanation of what information or document is missing.');
      return;
    }
    setIsProcessing(true);
    try {
      await requestAdditionalInfo(activeRequest.id, queryText);
      alert(`Query sent to student ${activeRequest.studentName}! Request status updated.`);
      setActiveTab('staff-assigned');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'The request could not be updated. Refresh and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('staff-assigned')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Queue</span>
        </button>

        {/* Queue Dropdown Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 hidden sm:inline">Switch Active Request:</span>
          <select
            value={activeRequest.id}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
          >
            {deptRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} · {r.serviceName} ({r.studentName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cross-Department Access Guard Warning if user somehow opened wrong request */}
      {!isAuthorizedDept && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-3">
          <Lock className="w-5 h-5 text-rose-700 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Access Restricted by Department Boundary: </span>
            This request belongs to {activeRequest.assignedDepartmentId}. As staff of {currentUser.departmentId}, you can inspect details in read-only mode but cannot verify or approve.
          </div>
        </div>
      )}

      {/* Request Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-900">
              <span>{activeRequest.id}</span>
              <span>·</span>
              <span>{activeRequest.serviceCode}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeRequest.serviceName}
            </h1>
          </div>
          <div>
            <StatusBadge status={activeRequest.status} size="lg" />
          </div>
        </div>

        {/* Student & Department Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Student Name:</span>
            <p className="font-semibold text-slate-900">{activeRequest.studentName}</p>
            <p className="text-[11px] text-slate-500 font-mono">{activeRequest.studentRoll}</p>
          </div>

          <div>
            <span className="text-slate-400">Contact Email:</span>
            <p className="font-semibold text-slate-900">{activeRequest.studentEmail}</p>
            <p className="text-[11px] text-slate-500">{activeRequest.studentDepartment}</p>
          </div>

          <div>
            <span className="text-slate-400">Submission Timestamp:</span>
            <p className="font-semibold text-slate-900">
              {new Date(activeRequest.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {new Date(activeRequest.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div>
            <span className="text-slate-400">Approving Authority:</span>
            <p className="font-semibold text-slate-900">
              {activeRequest.approverName || 'Dean of Academic Affairs'}
            </p>
            <p className="text-[11px] text-slate-500">Awaiting Staff Sign-off</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Inspection & Staff Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Submitted Data & Document Checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Submitted Form Fields */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Application Fields
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              {Object.entries(activeRequest.formData).map(([k, v]) => (
                <div key={k} className="pt-2 first:pt-0">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{v || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Document Verification Checklist */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Uploaded Document Checklist ({activeRequest.uploadedDocuments.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Click &quot;Inspect Document&quot; to review file preview
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {activeRequest.uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{doc.docName}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingFile(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Inspect Document</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Supplemental files if student responded to query */}
            {activeRequest.additionalDocuments && activeRequest.additionalDocuments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase">
                  Student Supplemental Uploads ({activeRequest.additionalDocuments.length})
                </span>
                {activeRequest.additionalDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-500">Submitted in response to query</p>
                    </div>
                    <button
                      onClick={() => setInspectingFile(doc)}
                      className="text-xs font-semibold text-amber-900 hover:underline"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Staff Action Desk */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Verification Controls
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Staff Audit &amp; Forwarding Decision
              </h3>
            </div>

            {/* Action Mode Toggle Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveActionTab('verify')}
                className={`py-1.5 font-semibold rounded-md transition-all ${
                  activeActionTab === 'verify'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Verify &amp; Forward
              </button>
              <button
                type="button"
                onClick={() => setActiveActionTab('query')}
                className={`py-1.5 font-semibold rounded-md transition-all ${
                  activeActionTab === 'query'
                    ? 'bg-white text-rose-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Query More Info
              </button>
            </div>

            {/* TAB 1: Verify & Forward */}
            {activeActionTab === 'verify' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Verification Audit Remarks (Mandatory)
                  </label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter document verification outcome, attendance checks, fee status..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    disabled={!isAuthorizedDept}
                  />
                  <p className="text-[11px] text-slate-400">
                    These notes will appear on the student tracking timeline and be forwarded to {activeRequest.approverName || 'the Dean'}.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isProcessing || !isAuthorizedDept}
                  onClick={handleVerify}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Verify Documents &amp; Forward to Approver</span>
                </button>
              </div>
            )}

            {/* TAB 2: Query Additional Information */}
            {activeActionTab === 'query' && (
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                  Moving this request to <strong>Additional Information Required</strong> will notify the student and pause the approval workflow until they submit clarifications.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mandatory Query for Student
                  </label>
                  <textarea
                    rows={4}
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Clearly explain which document is missing or invalid (e.g., 'Please provide an updated bank challan with legible UTR reference number')..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                    disabled={!isAuthorizedDept}
                  />
                </div>

                <button
                  type="button"
                  disabled={isProcessing || !isAuthorizedDept}
                  onClick={handleRequestInfo}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Send Query to Student (Pause Request)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(inspectingFile)}
        file={inspectingFile}
        onClose={() => setInspectingFile(null)}
        studentName={activeRequest.studentName}
        studentRoll={activeRequest.studentRoll}
      />
    </div>
  );
};
