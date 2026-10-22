import React, { useEffect, useState } from 'react';
import { X, Download, FileText, CheckCircle2, Shield, Calendar, HardDrive } from 'lucide-react';
import { UploadedFile } from '../../types';
import { supabase } from '../../lib/supabase';

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
  studentName = 'Student',
  studentRoll = 'Not provided',
}) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    let active = true;
    setDocumentUrl(file?.dataUrl || null);
    setLoadingDocument(false);

    if (!isOpen || !file?.storagePath || file.dataUrl || !supabase) {
      return () => { active = false; };
    }

    setLoadingDocument(true);
    void supabase.storage
      .from('stepwise-documents')
      .createSignedUrl(file.storagePath, 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Unable to access stored document:', error.message);
          setDocumentUrl(null);
        } else {
          setDocumentUrl(data.signedUrl);
        }
        setLoadingDocument(false);
      });

    return () => { active = false; };
  }, [isOpen, file?.storagePath, file?.dataUrl]);

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
                  PRIVATE DOCUMENT STORAGE
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {file.storagePath ? 'Stored request attachment' : 'Document preview'}
                </h4>
                <p className="text-xs text-slate-500">Access is controlled by your authenticated StepWise account.</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{documentUrl ? 'Available' : loadingDocument ? 'Loading' : 'Unavailable'}</span>
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

            {/* Render the actual private upload when available. */}
            <div className="w-full min-h-[260px] rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
              {loadingDocument ? (
                <div className="p-8 text-sm text-slate-500">Loading private document…</div>
              ) : documentUrl && (file.previewType === 'image' || file.fileType.startsWith('image/')) ? (
                <img src={documentUrl} alt={file.fileName} className="max-h-[480px] max-w-full object-contain" />
              ) : documentUrl && (file.previewType === 'pdf' || file.fileType.includes('pdf')) ? (
                <iframe src={documentUrl} title={file.fileName} className="w-full h-[480px]" />
              ) : documentUrl ? (
                <a href={documentUrl} target="_blank" rel="noreferrer" className="p-8 text-sm font-medium text-indigo-700 underline">
                  Open {file.fileName}
                </a>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Shield className="w-10 h-10 text-indigo-600/70 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">{file.fileName}</p>
                  <p className="text-xs text-slate-500">The stored file is unavailable in this session. Verify that the upload completed and that your account has permission to view it.</p>
                </div>
              )}
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
            {documentUrl ? 'Private document link expires after 60 seconds.' : 'Private document access is unavailable until the file is uploaded.'}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl || undefined}
              download={file.fileName}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!documentUrl}
              onClick={(event) => { if (!documentUrl) event.preventDefault(); }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border rounded-lg transition-colors ${documentUrl ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200' : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
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
