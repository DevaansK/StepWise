import React from 'react';
import { X, Download, FileText, CheckCircle2, Shield, Calendar, HardDrive } from 'lucide-react';
import { UploadedFile } from '../../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  file: UploadedFile | null;
  onClose: () => void;
  studentName?: string;
  studentRoll?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  file,
  onClose,
  studentName = 'Alex Chen',
  studentRoll = 'CS-2023-042',
}) => {
  if (!isOpen || !file) return null;

  const formattedSize = (file.fileSize / 1024).toFixed(1) + ' KB';
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                {file.docName}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {file.fileName} · {formattedSize}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Content Simulation Area */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 flex-1 flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200/80 shadow-sm p-6 text-slate-800 space-y-5">
            {/* College header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-indigo-800">
                  INSTITUTIONAL DOCUMENT REPOSITORY
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Verified Student Submission Attachment
                </h4>
                <p className="text-xs text-slate-500">Security Checksum: MD5-{Math.random().toString(36).substring(2, 9).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Uploaded</span>
              </div>
            </div>

            {/* Document Data Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-md border border-slate-100">
              <div>
                <span className="text-slate-500">Student Name:</span>
                <p className="font-semibold text-slate-900">{studentName}</p>
              </div>
              <div>
                <span className="text-slate-500">Institutional Roll ID:</span>
                <p className="font-semibold text-slate-900 font-mono">{studentRoll}</p>
              </div>
              <div>
                <span className="text-slate-500">Document Type:</span>
                <p className="font-medium text-slate-800">{file.docName}</p>
              </div>
              <div>
                <span className="text-slate-500">File Type:</span>
                <p className="font-medium text-slate-800 uppercase font-mono">{file.fileType}</p>
              </div>
            </div>

            {/* Simulated file visual preview */}
            <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
              <Shield className="w-10 h-10 text-indigo-600/70" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">
                  {file.fileName}
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Document scanned and encrypted using StepWise Document Security Engine. Available for staff inspection and OCR review.
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Uploaded {uploadDate}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> {formattedSize}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-500">
            * Demonstration file simulation stored in browser environment.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Simulated download: "${file.fileName}" (${formattedSize})`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors"
            >
              Done Viewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
