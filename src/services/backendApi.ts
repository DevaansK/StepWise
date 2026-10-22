import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  User,
  Role,
  Department,
  Service,
  ServiceRequest,
  RequestHistory,
  Notification,
  UploadedFile,
} from '../types';

/**
 * Backend API Service Layer for StepWise
 * Interacts with Supabase PostgreSQL and Supabase Storage when configured,
 * with clean fallback to local prototype data.
 */

// Helper to convert DB request row to TypeScript ServiceRequest
export function mapDbToRequest(row: any): ServiceRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    studentRoll: row.student_roll,
    studentDepartment: row.student_department,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceCode: row.service_code,
    formData: row.form_data || {},
    uploadedDocuments: (row.uploaded_documents as UploadedFile[]) || [],
    status: row.status,
    assignedDepartmentId: row.assigned_department_id,
    assignedStaffId: row.assigned_staff_id,
    assignedStaffName: row.assigned_staff_name,
    approverId: row.approver_id,
    approverName: row.approver_name,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    verificationRemarks: row.verification_remarks,
    decisionRemarks: row.decision_remarks,
    additionalInfoQuery: row.additional_info_query,
    additionalInfoResponse: row.additional_info_response,
    additionalDocuments: (row.additional_documents as UploadedFile[]) || [],
  };
}

// Helper to convert DB history row to RequestHistory
export function mapDbToHistory(row: any): RequestHistory {
  return {
    id: row.id,
    requestId: row.request_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorRole: row.actor_role as Role,
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    remarks: row.remarks || '',
    timestamp: row.timestamp,
  };
}

// Helper to convert DB profile row to User
export function mapDbToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    institutionalId: row.institutional_id,
    departmentId: row.department_id || 'dept-acad',
    role: row.role as Role,
    designation: row.designation,
    phone: row.phone,
    avatarUrl: row.avatar_url,
  };
}

// ==========================================
// File Storage Operations
// ==========================================
export async function uploadDocumentToStorage(
  file: File,
  requestId: string,
  docId: string
): Promise<{ url: string; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${requestId}/${docId}_${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('stepwise-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error, falling back to base64:', error.message);
      } else if (data) {
        const { data: publicData } = supabase.storage
          .from('stepwise-documents')
          .getPublicUrl(data.path);
        return { url: publicData.publicUrl };
      }
    } catch (err: any) {
      console.warn('Storage upload exception:', err);
    }
  }

  // Graceful fallback to client-side data URL for local/offline run
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ url: '', error: 'Failed to read file locally' });
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// Authentication Operations with Supabase
// ==========================================
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ user?: User; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: 'Supabase client is not configured' };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Authentication failed' };
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Fallback: construct profile from auth metadata
      const meta = authData.user.user_metadata || {};
      const fallbackUser: User = {
        id: authData.user.id,
        name: meta.name || email.split('@')[0],
        email: authData.user.email || email,
        institutionalId: meta.institutionalId || 'ID-TEMP',
        departmentId: meta.departmentId || 'dept-acad',
        role: (meta.role as Role) || 'STUDENT',
        designation: meta.designation,
        phone: meta.phone,
      };
      return { user: fallbackUser };
    }

    return { user: mapDbToUser(profile) };
  } catch (err: any) {
    return { error: err.message || 'Login request error' };
  }
}

export async function supabaseSignUp(
  email: string,
  password: string,
  metadata: {
    name: string;
    institutionalId: string;
    departmentId: string;
    role: Role;
    designation?: string;
    phone?: string;
  }
): Promise<{ user?: User; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: 'Supabase client is not configured' };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          institutionalId: metadata.institutionalId,
          departmentId: metadata.departmentId,
          role: metadata.role, // Strictly validated server-side/trigger
          designation: metadata.designation || '',
          phone: metadata.phone || '',
        },
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Registration failed' };
    }

    const newUser: User = {
      id: authData.user.id,
      name: metadata.name,
      email,
      institutionalId: metadata.institutionalId,
      departmentId: metadata.departmentId,
      role: metadata.role,
      designation: metadata.designation,
      phone: metadata.phone,
    };

    return { user: newUser };
  } catch (err: any) {
    return { error: err.message || 'Registration request error' };
  }
}

export async function supabaseSignOut(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut();
  }
}

// ==========================================
// Requests Data Operations
// ==========================================
export async function dbFetchRequests(): Promise<ServiceRequest[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Error fetching requests from Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapDbToRequest);
  } catch (err) {
    console.warn('Exception querying Supabase requests:', err);
    return null;
  }
}

export async function dbCreateRequest(req: ServiceRequest): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbRow = {
      id: req.id,
      student_id: req.studentId,
      student_name: req.studentName,
      student_email: req.studentEmail,
      student_roll: req.studentRoll,
      student_department: req.studentDepartment,
      service_id: req.serviceId,
      service_name: req.serviceName,
      service_code: req.serviceCode,
      form_data: req.formData,
      uploaded_documents: req.uploadedDocuments,
      status: req.status,
      assigned_department_id: req.assignedDepartmentId,
      assigned_staff_id: req.assignedStaffId || null,
      assigned_staff_name: req.assignedStaffName || null,
      approver_id: req.approverId,
      approver_name: req.approverName || null,
      verification_remarks: req.verificationRemarks || null,
      decision_remarks: req.decisionRemarks || null,
      additional_info_query: req.additionalInfoQuery || null,
      additional_info_response: req.additionalInfoResponse || null,
      additional_documents: req.additionalDocuments || [],
      submitted_at: req.submittedAt,
      updated_at: req.updatedAt,
    };

    const { error } = await supabase.from('service_requests').insert([dbRow]);
    if (error) {
      console.error('Supabase create request error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase create request exception:', err);
    return false;
  }
}

export async function dbUpdateRequest(
  requestId: string,
  updates: Partial<ServiceRequest>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.assignedStaffId !== undefined) dbUpdates.assigned_staff_id = updates.assignedStaffId;
    if (updates.assignedStaffName !== undefined) dbUpdates.assigned_staff_name = updates.assignedStaffName;
    if (updates.approverId !== undefined) dbUpdates.approver_id = updates.approverId;
    if (updates.approverName !== undefined) dbUpdates.approver_name = updates.approverName;
    if (updates.verificationRemarks !== undefined) dbUpdates.verification_remarks = updates.verificationRemarks;
    if (updates.decisionRemarks !== undefined) dbUpdates.decision_remarks = updates.decisionRemarks;
    if (updates.additionalInfoQuery !== undefined) dbUpdates.additional_info_query = updates.additionalInfoQuery;
    if (updates.additionalInfoResponse !== undefined) dbUpdates.additional_info_response = updates.additionalInfoResponse;
    if (updates.additionalDocuments !== undefined) dbUpdates.additional_documents = updates.additionalDocuments;

    const { error } = await supabase
      .from('service_requests')
      .update(dbUpdates)
      .eq('id', requestId);

    if (error) {
      console.error('Supabase update request error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase update request exception:', err);
    return false;
  }
}

export async function dbRecordHistory(history: RequestHistory): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbRow = {
      id: history.id,
      request_id: history.requestId,
      actor_id: history.actorId,
      actor_name: history.actorName,
      actor_role: history.actorRole,
      action: history.action,
      previous_status: history.previousStatus,
      new_status: history.newStatus,
      remarks: history.remarks,
      timestamp: history.timestamp,
    };

    const { error } = await supabase.from('request_histories').insert([dbRow]);
    if (error) {
      console.error('Supabase record history error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase record history exception:', err);
    return false;
  }
}

export async function dbCreateNotification(notif: Notification): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbRow = {
      id: notif.id,
      recipient_id: notif.recipientId || null,
      recipient_role: notif.recipientRole || null,
      request_id: notif.requestId || null,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.isRead,
      created_at: notif.createdAt,
    };

    const { error } = await supabase.from('notifications').insert([dbRow]);
    if (error) {
      console.error('Supabase create notification error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase create notification exception:', err);
    return false;
  }
}

export async function dbMarkNotificationRead(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}
