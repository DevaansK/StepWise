/**
 * Core Data Models & Types for StepWise
 * College Administrative Service and Process Automation System
 */

export type Role = 'STUDENT' | 'STAFF' | 'APPROVER' | 'ADMIN';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Verification'
  | 'Additional Information Required'
  | 'Verified'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  institutionalId: string; // e.g. Roll No or Staff Employee ID
  departmentId: string;
  role: Role;
  designation?: string;
  avatarUrl?: string;
  phone?: string;
  passwordHash?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  officeLocation: string;
  contactEmail: string;
  leadName: string;
  iconName: string;
}

export interface ServiceRequiredDocument {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  acceptedFormats: string[]; // e.g. ['PDF', 'JPG', 'PNG']
  maxSizeMB: number;
}

export interface ServiceFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  category: 'Certificates' | 'Academic Records' | 'Financial & Accounts' | 'Campus Life & Housing' | 'Identity & Security';
  description: string;
  departmentId: string;
  procedure: string[];
  requiredDocuments: ServiceRequiredDocument[];
  formFields: ServiceFormField[];
  estimatedProcessingDays: number;
  approvalRequired: boolean;
  approverId: string;
  approverTitle: string;
  fee: string;
  eligibility: string;
  isActive: boolean;
}

export interface UploadedFile {
  id: string;
  docId: string; // corresponds to ServiceRequiredDocument.id
  docName: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  uploadedAt: string;
  previewType?: 'pdf' | 'image' | 'generic';
  dataUrl?: string;
  /** Private Supabase Storage object path for real, persisted uploads. */
  storagePath?: string;
}

export interface ServiceRequest {
  id: string;
  /** Supabase UUID used for server-side workflow actions. */
  databaseId?: string; // e.g. "SW-2026-0001"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRoll: string;
  studentDepartment: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  formData: Record<string, string>;
  uploadedDocuments: UploadedFile[];
  status: RequestStatus;
  assignedDepartmentId: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  approverId: string;
  approverName?: string;
  submittedAt: string;
  updatedAt: string;
  verificationRemarks?: string;
  decisionRemarks?: string;
  additionalInfoQuery?: string;
  additionalInfoResponse?: string;
  additionalDocuments?: UploadedFile[];
}

export interface RequestHistory {
  id: string;
  requestId: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
  remarks: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientId?: string;
  recipientRole?: Role;
  requestId?: string;
  title: string;
  message: string;
  type: 'submission' | 'verification' | 'info_required' | 'forwarded' | 'approval' | 'rejection' | 'completion';
  createdAt: string;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relatedServiceId?: string | null;
  isDemoMode?: boolean;
}
