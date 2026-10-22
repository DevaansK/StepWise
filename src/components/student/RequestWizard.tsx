import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Building,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Service, UploadedFile, ServiceRequest } from '../../types';

export const RequestWizard: React.FC = () => {
  const {
    currentUser,
    services,
    departments,
    selectedServiceId,
    setSelectedServiceId,
    createRequest,
    setActiveTab,
  } = useApp();

  // Wizard state: Step 1 (Service), Step 2 (Details), Step 3 (Documents), Step 4 (Review)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequest | null>(null);

  // Initialize service from prop or default to Bonafide Certificate
  useEffect(() => {
    if (selectedServiceId) {
      const found = services.find((s) => s.id === selectedServiceId);
      if (found) {
        setSelectedService(found);
        setCurrentStep(2);
      }
    } else if (!selectedService && services.length > 0) {
      setSelectedService(services[0]);
    }
  }, [selectedServiceId, services]);

  if (!currentUser) return null;

  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setSelectedServiceId(srv.id);
    setFormData({});
    setUploadedFiles([]);
    setFormErrors({});
  };

  // Step 2 Form validation
  const validateStep2 = () => {
    if (!selectedService) return false;
    const errors: Record<string, string> = {};

    selectedService.formFields.forEach((field) => {
      if (field.required && (!formData[field.id] || !formData[field.id].trim())) {
        errors[field.id] = `${field.label} is required.`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Document validation
  const validateStep3 = () => {
    if (!selectedService) return false;
    const errors: Record<string, string> = {};

    selectedService.requiredDocuments.forEach((doc) => {
      if (doc.mandatory) {
        const hasDoc = uploadedFiles.some((f) => f.docId === doc.id);
        if (!hasDoc) {
          errors[doc.id] = `Mandatory document "${doc.name}" is missing.`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Read the actual file so the submission flow can upload bytes to private Supabase Storage.
  const handleFileUpload = async (docId: string, docName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({ ...prev, [docId]: 'Upload a PDF, JPEG, or PNG file.' }));
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, [docId]: 'File must be 10 MB or smaller.' }));
      input.value = '';
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Could not read file'));
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });

      const newUploaded: UploadedFile = {
        id: `up-${Date.now()}`,
        docId,
        docName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        previewType: file.type.startsWith('image/') ? 'image' : 'pdf',
        dataUrl,
      };

      setUploadedFiles((prev) => [...prev.filter((uploaded) => uploaded.docId !== docId), newUploaded]);
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[docId];
        return copy;
      });
    } catch (error) {
      console.error('Could not read selected document:', error);
      setFormErrors((prev) => ({ ...prev, [docId]: 'Could not read this file. Please choose it again.' }));
    } finally {
      input.value = '';
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Final Submission
  const handleSubmit = async () => {
    if (isSubmitting || !selectedService) return;
    setIsSubmitting(true);

    try {
      const created = await createRequest(selectedService.id, formData, uploadedFiles);
      setSubmittedRequest(created);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'The request could not be saved. Please check My Requests before trying again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Select Service' },
    { num: 2, title: 'Fill Details' },
    { num: 3, title: 'Upload Documents' },
    { num: 4, title: 'Review & Submit' },
  ];

  // Success Screen
  if (submittedRequest) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Request Logged in System
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            Service Request Successfully Submitted!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Your application for <strong>{submittedRequest.serviceName}</strong> has been assigned to the relevant department queue.
          </p>
        </div>

        {/* Request ID Display */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 max-w-md mx-auto space-y-2">
          <span className="text-xs text-slate-500">Your Unique Tracking Reference ID:</span>
          <div className="text-2xl font-mono font-black text-indigo-950 tracking-wider">
            {submittedRequest.id}
          </div>
          <div className="text-[11px] text-slate-400">
            Status: <strong className="text-blue-600">Submitted &amp; In Queue</strong> · Routed to {submittedRequest.assignedDepartmentId.toUpperCase()}
          </div>
        </div>

        {/* Next Steps Guidance */}
        <div className="text-left text-xs bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2 max-w-md mx-auto text-slate-700">
          <span className="font-bold text-indigo-950 block">Next Administrative Steps:</span>
          <ul className="space-y-1 list-disc list-inside text-indigo-900">
            <li>Department verification officers will review your documents.</li>
            <li>You will receive an in-app alert if any missing files are queried.</li>
            <li>Once verified, the request will be forwarded to the Dean for endorsement.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setActiveTab('request-detail', submittedRequest.id)}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>Track in My Requests</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setSubmittedRequest(null);
              setCurrentStep(1);
              setFormData({});
              setUploadedFiles([]);
            }}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          New Administrative Service Request
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Step-by-step verified submission wizard with document checklist validation.
        </p>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-900 text-white ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                    isCurrent ? 'text-indigo-950 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Step 1: Choose Institutional Service
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the service you wish to apply for from the college directory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {services
                .filter((s) => s.isActive)
                .map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  const dept = departments.find((d) => d.id === srv.departmentId);

                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleSelectService(srv)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-semibold uppercase text-indigo-800">
                            {srv.code} · {srv.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                            {srv.name}
                          </h4>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{dept?.name}</span>
                        <span>~{srv.estimatedProcessingDays} days</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* STEP 2: Fill Details */}
        {currentStep === 2 && selectedService && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <span>{selectedService.code}</span>
                <span>·</span>
                <span>{selectedService.category}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                Step 2: Enter Application Details for {selectedService.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Please provide accurate details required by the {selectedService.approverTitle}.
              </p>
            </div>

            {/* Applicant Summary Banner */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400">Student:</span>
                <p className="font-semibold text-slate-900">{currentUser.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Roll No:</span>
                <p className="font-semibold text-slate-900 font-mono">
                  {currentUser.institutionalId}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <p className="font-medium text-slate-800">
                  {currentUser.designation || 'Undergraduate'}
                </p>
              </div>
            </div>

            {/* Dynamic Form Fields */}
            <div className="space-y-4">
              {selectedService.formFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    {field.label}{' '}
                    {field.required ? (
                      <span className="text-rose-600">*</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    )}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 ${
                        formErrors[field.id] ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Select an option --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={formData[field.id] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 ${
                        formErrors[field.id] ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                      }`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.id] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 ${
                        formErrors[field.id] ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                      }`}
                    />
                  )}

                  {field.helpText && (
                    <p className="text-[11px] text-slate-400">{field.helpText}</p>
                  )}

                  {formErrors[field.id] && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      {formErrors[field.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Required Documents */}
        {currentStep === 3 && selectedService && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Step 3: Upload Required Documents
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach clear PDF or image scans for verification by{' '}
                {departments.find((d) => d.id === selectedService.departmentId)?.name}.
              </p>
            </div>

            {/* Prototype Storage Notice */}
            <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Prototype Storage:</strong> Selected file metadata and local previews are securely held in your browser session for live verification demonstration.
              </span>
            </div>

            {/* Documents Checklist & Uploaders */}
            <div className="space-y-4">
              {selectedService.requiredDocuments.map((doc) => {
                const uploaded = uploadedFiles.find((f) => f.docId === doc.id);
                const isError = Boolean(formErrors[doc.id]);

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      uploaded
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isError
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {doc.name}
                          </h4>
                          {doc.mandatory ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          Formats: {doc.acceptedFormats.join(', ')} · Max {doc.maxSizeMB}MB
                        </p>
                      </div>

                      {/* Upload status / controls */}
                      <div className="shrink-0">
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="truncate max-w-[140px] font-mono text-[11px]">
                                {uploaded.fileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(uploaded.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Select Sample File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(doc.id, doc.name, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {isError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-2 pt-2 border-t border-rose-200/50">
                        {formErrors[doc.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {currentStep === 4 && selectedService && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Step 4: Review Application &amp; Confirm Submission
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all entered information and document attachments before final routing.
              </p>
            </div>

            {/* Review Cards */}
            <div className="space-y-4 text-xs">
              {/* Service & Routing Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Service &amp; Routing
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Service:</span>
                    <p className="font-semibold text-slate-900">{selectedService.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Department:</span>
                    <p className="font-semibold text-slate-900">
                      {departments.find((d) => d.id === selectedService.departmentId)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Final Endorsement Authority:</span>
                    <p className="font-semibold text-slate-900">{selectedService.approverTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Estimated Turnaround:</span>
                    <p className="font-semibold text-slate-900">
                      ~{selectedService.estimatedProcessingDays} Business Days
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Data Review Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Application Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(formData).map(([k, v]) => {
                    const fieldDef = selectedService.formFields.find((f) => f.id === k);
                    return (
                      <div key={k}>
                        <span className="text-slate-500">{fieldDef?.label || k}:</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{v || 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attached Documents Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Attached Documents ({uploadedFiles.length})
                </span>
                <div className="space-y-1.5">
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2 rounded bg-white border border-slate-200/60"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-700" />
                        <span className="font-medium text-slate-800">{f.docName}:</span>
                        <span className="font-mono text-slate-500 text-[11px]">{f.fileName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    if (!selectedService) {
                      alert('Please select a service first.');
                      return;
                    }
                    setCurrentStep(2);
                  } else if (currentStep === 2) {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  } else if (currentStep === 3) {
                    if (validateStep3()) {
                      setCurrentStep(4);
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <span>Submit Service Request</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
