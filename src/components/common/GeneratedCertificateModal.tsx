import React from 'react';
import { X, Printer, ShieldCheck, Award, QrCode } from 'lucide-react';
import { ServiceRequest } from '../../types';
import { TEAM_MEMBERS } from '../../config/teamConfig';

interface GeneratedCertificateModalProps {
  isOpen: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
}

export const GeneratedCertificateModal: React.FC<GeneratedCertificateModalProps> = ({
  isOpen,
  request,
  onClose,
}) => {
  if (!isOpen || !request) return null;

  const issueDate = new Date(request.updatedAt || request.submittedAt).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-teal-50 text-teal-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Official University Endorsed Document
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div className="p-8 overflow-y-auto bg-slate-100/60 flex items-center justify-center">
          <div
            id="printable-certificate"
            className="w-full max-w-2xl bg-white rounded-lg border-4 border-double border-indigo-950/20 p-8 shadow-md relative text-slate-900"
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-80 h-80 text-indigo-950" />
            </div>

            {/* University Letterhead */}
            <div className="text-center border-b-2 border-indigo-950 pb-5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold tracking-tight text-lg shadow-xs">
                  SW
                </div>
                <span className="text-xl font-bold tracking-tight text-indigo-950 uppercase">
                  Metropolitan Institute of Technology
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">
                Office of Academic Affairs & Student Records · Cambridge, MA
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Accredited Institutional Service · StepWise Verification System
              </p>
            </div>

            {/* Certificate Meta Details */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-6 font-mono border-b border-slate-100 pb-3">
              <div>
                <span className="text-slate-400">REF NO: </span>
                <span className="font-semibold text-slate-800">{request.id}</span>
              </div>
              <div>
                <span className="text-slate-400">DATE OF ISSUE: </span>
                <span className="font-semibold text-slate-800">{issueDate}</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h2 className="text-xl font-serif font-bold text-indigo-950 uppercase tracking-widest underline decoration-indigo-300 underline-offset-8">
                {request.serviceName.toUpperCase()}
              </h2>
            </div>

            {/* Body Text */}
            <div className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif text-justify my-8 px-2">
              <p>
                This is to officially certify that <strong className="font-sans font-bold text-slate-950">{request.studentName}</strong>, bearing Institutional Roll Number <strong className="font-sans font-mono font-bold text-indigo-950">{request.studentRoll}</strong>, is a bonafide and actively enrolled student of the <strong className="font-sans font-semibold text-slate-900">{request.studentDepartment}</strong> at this institute.
              </p>

              {request.formData && request.formData.purpose && (
                <p>
                  This document has been issued upon the candidate&apos;s formal administrative application for the verified purpose of: <em className="font-sans font-medium text-slate-950 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">{request.formData.purpose}</em>.
                </p>
              )}

              {request.formData && request.formData.academicYear && (
                <p>
                  Current Enrolled Standing: <strong>{request.formData.academicYear}</strong>. As per university records, the student possesses satisfactory attendance, clears tuition commitments, and maintains good institutional standing.
                </p>
              )}

              {request.decisionRemarks && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-sans text-slate-700">
                  <span className="font-semibold text-slate-900">Endorsement Note: </span>
                  {request.decisionRemarks}
                </div>
              )}
            </div>

            {/* Signatures & Seal Section */}
            <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 items-end">
              {/* QR Code Verification */}
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <div className="p-2 border border-slate-200 rounded bg-white shadow-2xs">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Scan to Verify Online
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {request.id}-SEC
                </span>
              </div>

              {/* Embossed Seal Stamp */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full border-2 border-indigo-900/40 border-dashed flex flex-col items-center justify-center p-2 text-indigo-900 text-[10px] font-bold uppercase tracking-tighter">
                  <span>METROPOLITAN</span>
                  <span className="text-xs font-black text-indigo-950">SEAL</span>
                  <span>EST. 1984</span>
                </div>
                <span className="text-[10px] text-indigo-900 font-medium mt-1">
                  OFFICIAL INSTITUTIONAL SEAL
                </span>
              </div>

              {/* Dean Signature */}
              <div className="text-right flex flex-col items-end">
                <div className="font-serif italic text-lg font-bold text-indigo-950 pr-2">
                  {request.approverName || TEAM_MEMBERS.approver.name}
                </div>
                <div className="w-36 border-b border-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {request.approverName || TEAM_MEMBERS.approver.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Dean of Academic Affairs
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Digitally Signed & Validated
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white">
          <span className="text-xs text-slate-500">
            * This certificate includes a tamper-evident digital cryptographic verification mark.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
