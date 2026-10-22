import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  Award,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { GeneratedCertificateModal } from '../common/GeneratedCertificateModal';
import { UploadedFile, RequestStatus } from '../../types';
import { uploadDocumentToStorage } from '../../services/backendApi';
import { validateDocumentFile, sanitizeFileName } from '../../utils/fileValidation';

export const RequestDetailView: React.FC = () => {
  const {
    selectedRequestId,
    requests,
    histories,
    departments,
    setActiveTab,
    submitAdditionalInfo,
    currentUser,
  } = useApp();

  const [inspectingFile, setInspectingFile] = useState<UploadedFile | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  // Additional info response state
  const [responseText, setResponseText] = useState<string>('');
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);

  const request = requests.find((r) => r.id === selectedRequestId);
  if (!request) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">Request not found.</p>
        <button
          onClick={() => setActiveTab('my-requests')}
          className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-900 rounded-lg"
        >
          Return to My Requests
        </button>
      </div>
    );
  }

  // Student Access Isolation Guard
  if (currentUser?.role === 'STUDENT' && request.studentId !== currentUser.id) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">
          Students can only access and view their own submitted administrative service requests.
        </p>
        <button
          onClick={() => setActiveTab('my-requests')}
          className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-900 rounded-lg shadow-sm"
        >
          Return to My Requests
        </button>
      </div>
    );
  }

  const dept = departments.find((d) => d.id === request.assignedDepartmentId);
  const requestHistories = histories
    .filter((h) => h.requestId === request.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Handle student attaching additional response files
  const handleAddResponseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow reselection
    e.target.value = '';

    const validation = await validateDocumentFile(file, {
      id: 'doc-additional-response',
      name: 'Supplemental Document',
      description: 'Additional documentation requested by department staff',
      mandatory: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 10,
    });

    if (!validation.valid) {
      alert(validation.error || 'Invalid file format or size.');
      return;
    }

    const safeName = sanitizeFileName(file.name);
    const uploadRes = await uploadDocumentToStorage(file, request.id, 'additional_doc');

    const newFile: UploadedFile = {
      id: `add-up-${Date.now()}`,
      docId: 'doc-additional-response',
      docName: 'Supplemental Document / Clarification',
      fileName: safeName,
      fileSize: file.size,
      fileType: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      previewType: file.type.includes('image') ? 'image' : 'pdf',
      dataUrl: uploadRes.url,
    };
    setAdditionalFiles((prev) => [...prev, newFile]);
  };

  const handleResubmit = () => {
    if (!responseText.trim() && additionalFiles.length === 0) {
      alert('Please provide a response message or attach the requested document.');
      return;
    }
    setIsResubmitting(true);
    submitAdditionalInfo(request.id, responseText, additionalFiles);
    setIsResubmitting(false);
    setResponseText('');
    setAdditionalFiles([]);
    alert('Information resubmitted! Request has returned to Under Verification.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Back Nav & Quick Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (currentUser?.role === 'STAFF') setActiveTab('staff-assigned');
            else if (currentUser?.role === 'APPROVER') setActiveTab('approver-pending');
            else if (currentUser?.role === 'ADMIN') setActiveTab('admin-requests');
            else setActiveTab('my-requests');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </button>

        {/* Certificate trigger if approved/completed */}
        {(request.status === 'Approved' || request.status === 'Completed') && (
          <button
            onClick={() => setIsCertificateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>View / Print Official Certificate</span>
          </button>
        )}
      </div>

      {/* Main Request Meta Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-indigo-950">
                {request.id}
              </span>
              <span>·</span>
              <span className="text-xs font-mono font-medium text-slate-500">
                {request.serviceCode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {request.serviceName}
            </h1>
          </div>
          <div>
            <StatusBadge status={request.status} size="lg" />
          </div>
        </div>

        {/* Sub-meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Applicant:</span>
            <p className="font-semibold text-slate-900">{request.studentName}</p>
            <p className="text-[11px] text-slate-500 font-mono">{request.studentRoll}</p>
          </div>

          <div>
            <span className="text-slate-400">Department:</span>
            <p className="font-semibold text-slate-900">{dept?.name || request.assignedDepartmentId}</p>
            <p className="text-[11px] text-slate-500">{dept?.officeLocation}</p>
          </div>

          <div>
            <span className="text-slate-400">Submission Date:</span>
            <p className="font-semibold text-slate-900">
              {new Date(request.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-[11px] text-slate-500">
              {new Date(request.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div>
            <span className="text-slate-400">Approving Authority:</span>
            <p className="font-semibold text-slate-900">
              {request.approverName || 'Dean of Academic Affairs'}
            </p>
            <p className="text-[11px] text-slate-500">Digital Seal &amp; QR Endorsed</p>
          </div>
        </div>
      </div>

      {/* ACTION REQUIRED: Additional Information Request Box */}
      {request.status === 'Additional Information Required' && (
        <div className="p-5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 space-y-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Action Required from Student: Missing Information or Clarification
              </h3>
              <p className="text-xs text-rose-900 mt-1 leading-relaxed bg-white/70 p-3 rounded border border-rose-200/60 font-medium">
                &ldquo;{request.additionalInfoQuery}&rdquo;
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                Requested by: {request.assignedStaffName || 'Department Verification Officer'}
              </p>
            </div>
          </div>

          {/* Student Response Form */}
          <div className="bg-white p-4 rounded-xl border border-rose-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Submit Clarification &amp; Attach Files
            </h4>

            <div>
              <textarea
                rows={2}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter response or explanation for the verification officer..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Attach Missing File</span>
                <input type="file" className="hidden" onChange={handleAddResponseFile} />
              </label>

              <button
                onClick={handleResubmit}
                disabled={isResubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-2xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resubmit Response</span>
              </button>
            </div>

            {/* Attached files previews */}
            {additionalFiles.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                {additionalFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-xs p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900"
                  >
                    <span className="font-mono text-[11px]">{f.fileName}</span>
                    <button
                      onClick={() =>
                        setAdditionalFiles((prev) => prev.filter((item) => item.id !== f.id))
                      }
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Vertical Timeline & Submitted Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Vertical Tracking Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Workflow Tracking Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifiable event log with department audit timestamps
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {requestHistories.length} Events Recorded
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {requestHistories.map((event, idx) => {
              const isLast = idx === requestHistories.length - 1;

              return (
                <div key={event.id} className="relative group">
                  {/* Pin Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white ${
                      isLast
                        ? 'bg-indigo-900 text-white shadow-xs'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isLast ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  {/* Event Content */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {event.action}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(event.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{event.actorName}</span>
                      <span>·</span>
                      <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                        {event.actorRole}
                      </span>
                    </div>

                    {event.remarks && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 leading-relaxed">
                        {event.remarks}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Future Pending Stages Indicator if not finished */}
            {request.status !== 'Completed' && request.status !== 'Rejected' && (
              <div className="relative opacity-60">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] ring-4 ring-white">
                  <Clock className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500">
                    {request.status === 'Pending Approval'
                      ? 'Final Executive Approval & Digital Stamp (In Progress)'
                      : 'Approval & Certificate Dispatch (Upcoming)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Will update automatically once authorized by {request.approverName || 'Dean'}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Details & Uploaded Files */}
        <div className="space-y-6">
          {/* Form Data Fields */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Information
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              {Object.entries(request.formData).map(([k, v]) => (
                <div key={k} className="pt-2 first:pt-0">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{v || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Attached Documents ({request.uploadedDocuments.length})
            </h3>

            <div className="space-y-2 text-xs">
              {request.uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-700 shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate">{doc.docName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingFile(doc)}
                    className="shrink-0 p-1.5 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-50 rounded transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                    title="Inspect file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Additional documents uploaded later */}
            {request.additionalDocuments && request.additionalDocuments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase">
                  Supplemental Attachments
                </span>
                {request.additionalDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between text-xs"
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-500">Resubmitted file</p>
                    </div>
                    <button
                      onClick={() => setInspectingFile(doc)}
                      className="text-xs text-amber-900 hover:underline font-medium"
                    >
                      View
                    </button>
                  </div>
                ))}
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
        studentName={request.studentName}
        studentRoll={request.studentRoll}
      />

      {/* Generated Certificate Modal */}
      <GeneratedCertificateModal
        isOpen={isCertificateOpen}
        request={request}
        onClose={() => setIsCertificateOpen(false)}
      />
    </div>
  );
};
