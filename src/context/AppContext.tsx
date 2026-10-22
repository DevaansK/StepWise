import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Role,
  Department,
  Service,
  ServiceRequest,
  RequestHistory,
  Notification,
  RequestStatus,
  UploadedFile,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_SERVICES,
  INITIAL_USERS,
  INITIAL_REQUESTS,
  INITIAL_HISTORIES,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { hashPassword, DEFAULT_PASSWORD_HASH, DEFAULT_DEMO_PASSWORD } from '../utils/crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  services: Service[];
  requests: ServiceRequest[];
  histories: RequestHistory[];
  notifications: Notification[];
  activeTab: string;
  selectedRequestId: string | null;
  selectedServiceId: string | null;
  unreadCount: number;
  isWalkthroughOpen: boolean;
  isAuthenticated: boolean;

  // Actions
  setActiveTab: (tab: string, contextId?: string | null) => void;
  setSelectedRequestId: (id: string | null) => void;
  setSelectedServiceId: (id: string | null) => void;
  setIsWalkthroughOpen: (isOpen: boolean) => void;

  // Authentication & Role
  switchRole: (role: Role, userId?: string) => void;
  loginUser: (emailOrId: string, password?: string) => Promise<LoginResult>;
  registerUser: (newUserData: Partial<User> & { password?: string }) => Promise<RegisterResult>;
  logout: () => void;

  // Request Lifecycle (Shared Central Source of Truth)
  createRequest: (
    serviceId: string,
    formData: Record<string, string>,
    uploadedDocuments: UploadedFile[]
  ) => ServiceRequest;
  verifyDocuments: (requestId: string, remarks: string, forwardToApprover: boolean) => void;
  requestAdditionalInfo: (requestId: string, query: string) => void;
  submitAdditionalInfo: (
    requestId: string,
    responseText: string,
    additionalFiles: UploadedFile[]
  ) => void;
  approveRequest: (requestId: string, remarks: string, markCompleted?: boolean) => void;
  rejectRequest: (requestId: string, remarks: string) => void;
  completeRequest: (requestId: string, remarks?: string) => void;

  // Notification Operations
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Service Catalogue Admin Operations
  updateService: (service: Service) => void;
  createService: (service: Omit<Service, 'id'>) => Service;
  toggleServiceStatus: (serviceId: string) => void;

  // Reset Prototype
  resetToDefaultData: () => void;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'stepwise_current_user',
  USERS: 'stepwise_users',
  SESSION: 'stepwise_session',
  REQUESTS: 'stepwise_requests',
  SERVICES: 'stepwise_services',
  HISTORIES: 'stepwise_histories',
  NOTIFICATIONS: 'stepwise_notifications',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load departments
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);

  // Load or initialize users with password hashes
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Inject default password hash into initial users
    return INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: u.passwordHash || DEFAULT_PASSWORD_HASH,
    }));
  });

  // Session & Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false;
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session === 'false') return false;
      return true; // legacy demo mode only
    } catch {
      return true;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (isSupabaseConfigured) return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0]; // Alex Chen, Student
  });

  // Shared requests dataset (Central Single Source of Truth)
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REQUESTS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SERVICES;
  });

  const [histories, setHistories] = useState<RequestHistory[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HISTORIES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // UI Navigation states
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);

  // Restore real Supabase sessions when configured. Demo mode remains available only without configuration.
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, institutional_id, department, role, phone').eq('id', userId).maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        console.error('Unable to load StepWise profile:', error?.message || 'Profile not found');
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }
      const roleMap: Record<string, Role> = { student: 'STUDENT', department_staff: 'STAFF', approver: 'APPROVER', admin: 'ADMIN' };
      const mapped: User = {
        id: data.id,
        name: data.full_name || 'Student',
        email: data.email || '',
        institutionalId: data.institutional_id || '',
        departmentId: data.department || 'dept-acad',
        role: roleMap[data.role] || 'STUDENT',
        phone: data.phone || undefined,
      };
      setCurrentUser(mapped);
      setIsAuthenticated(true);
      if (mapped.role === 'STAFF') setActiveTab('staff-assigned');
      else if (mapped.role === 'APPROVER') setActiveTab('approver-pending');
      else if (mapped.role === 'ADMIN') setActiveTab('admin-dashboard');
      else setActiveTab('dashboard');
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Session restore failed:', error.message);
      if (!mounted) return;
      if (data.session?.user) void loadProfile(data.session.user.id);
      else { setCurrentUser(null); setIsAuthenticated(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        // Defer Supabase queries outside the auth callback to avoid lock contention.
        window.setTimeout(() => { if (mounted) void loadProfile(session.user.id); }, 0);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  // Load persistent requests for the authenticated user; demo seed data is not mixed into real accounts.
  useEffect(() => {
    if (!supabase || !currentUser?.id) return;
    let cancelled = false;
    const loadRequests = async () => {
      const { data, error } = await supabase.from('service_requests').select('*').order('submitted_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('Unable to load StepWise requests:', error.message);
        return;
      }
      const statusMap: Record<string, RequestStatus> = {
        draft: 'Draft', submitted: 'Submitted', under_verification: 'Under Verification',
        additional_information_required: 'Additional Information Required', verified: 'Verified',
        pending_approval: 'Pending Approval', approved: 'Approved', rejected: 'Rejected', completed: 'Completed',
      };
      const mapped: ServiceRequest[] = (data || []).map((row: any) => {
        const service = services.find((item) => item.name === row.service_name || item.code === row.service_code);
        return {
          id: 'SW-' + new Date(row.submitted_at || Date.now()).getFullYear() + '-' + String(row.tracking_number).padStart(4, '0'),
          databaseId: row.id,
          studentId: row.student_id,
          studentName: row.student_name || currentUser.name,
          studentEmail: row.student_email || currentUser.email,
          studentRoll: row.student_roll || currentUser.institutionalId,
          studentDepartment: row.student_department || currentUser.departmentId,
          serviceId: service?.id || row.service_id,
          serviceName: row.service_name || service?.name || 'College Service',
          serviceCode: row.service_code || service?.code || '',
          formData: row.form_data || {},
          uploadedDocuments: row.uploaded_documents || [],
          status: statusMap[row.status] || 'Submitted',
          assignedDepartmentId: row.assigned_department_id || service?.departmentId || '',
          assignedStaffId: row.assigned_staff_id || undefined,
          approverId: row.assigned_approver_id || service?.approverId || '',
          submittedAt: row.submitted_at,
          updatedAt: row.updated_at,
          verificationRemarks: row.staff_comments || undefined,
        };
      });
      setRequests(mapped);
    };
    void loadRequests();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Sync demo-only state to localStorage; real sessions are managed by Supabase Auth.
  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.SESSION, String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(histories));
  }, [histories]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Navigation helper
  const setActiveTab = (tab: string, contextId?: string | null) => {
    if (tab === 'request-detail' && contextId) {
      setSelectedRequestId(contextId);
    }
    if (tab === 'service-detail' && contextId) {
      setSelectedServiceId(contextId);
    }
    if (tab === 'new-request' && contextId) {
      setSelectedServiceId(contextId);
    }
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Role Switching & Demo Authentication
  const switchRole = (role: Role, userId?: string) => {
    if (isSupabaseConfigured) {
      console.warn('Demo role switching is disabled when real authentication is configured.');
      return;
    }
    let targetUser: User | undefined;
    if (userId) {
      targetUser = users.find((u) => u.id === userId);
    } else {
      targetUser = users.find((u) => u.role === role);
    }
    if (targetUser) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      // Auto-navigate to appropriate role dashboard
      if (role === 'STUDENT') setActiveTab('dashboard');
      else if (role === 'STAFF') setActiveTab('staff-assigned');
      else if (role === 'APPROVER') setActiveTab('approver-pending');
      else if (role === 'ADMIN') setActiveTab('admin-dashboard');
    }
  };

  // Login handler with password hashing validation
  const loginUser = async (emailOrId: string, password?: string): Promise<LoginResult> => {
    const cleanId = emailOrId.trim().toLowerCase();
    if (supabase) {
      if (!password) return { success: false, error: 'Password is required.' };
      let email = cleanId;
      if (!cleanId.includes('@')) return { success: false, error: 'Please sign in using your registered email address.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.institutionalId.toLowerCase() === cleanId
    );

    if (!found) {
      return {
        success: false,
        error: 'No account found with this institutional email or ID.',
      };
    }

    // Verify password if provided
    if (password) {
      const inputHash = await hashPassword(password);
      const isDefaultMatch =
        password === DEFAULT_DEMO_PASSWORD ||
        inputHash === DEFAULT_PASSWORD_HASH;
      const isCustomMatch = found.passwordHash && found.passwordHash === inputHash;

      if (!isDefaultMatch && !isCustomMatch) {
        return {
          success: false,
          error: 'Invalid password. Please check your credentials.',
        };
      }
    }

    setCurrentUser(found);
    setIsAuthenticated(true);

    if (found.role === 'STUDENT') setActiveTab('dashboard');
    else if (found.role === 'STAFF') setActiveTab('staff-assigned');
    else if (found.role === 'APPROVER') setActiveTab('approver-pending');
    else if (found.role === 'ADMIN') setActiveTab('admin-dashboard');

    return { success: true };
  };

  // Register handler with validation, duplicate check, and privilege isolation
  const registerUser = async (
    newUserData: Partial<User> & { password?: string }
  ): Promise<RegisterResult> => {
    const email = (newUserData.email || '').trim().toLowerCase();
    const instId = (newUserData.institutionalId || '').trim().toUpperCase();
    if (supabase) {
      if (!newUserData.name?.trim() || !email || !instId || !newUserData.password) {
        return { success: false, error: 'Name, college email, institutional ID, and password are required.' };
      }
      if (newUserData.password.length < 8) return { success: false, error: 'Password must be at least 8 characters long.' };
      const { data: duplicate } = await supabase.from('profiles').select('id').or('email.eq.' + email + ',institutional_id.eq.' + instId).limit(1);
      if (duplicate?.length) return { success: false, error: 'An account already exists with this email or institutional ID.' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password: newUserData.password,
        options: { data: { full_name: newUserData.name.trim(), institutional_id: instId, department: newUserData.departmentId || 'dept-acad', phone: newUserData.phone || '' }, emailRedirectTo: window.location.origin },
      });
      if (error) return { success: false, error: error.message };
      if (!data.session) return { success: false, error: 'Registration created. Check your email to confirm the account, then sign in.' };
      return { success: true };
    }

    if (!newUserData.name || !newUserData.name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!email) {
      return { success: false, error: 'College email address is required.' };
    }
    if (!instId) {
      return { success: false, error: 'Student institutional ID or Roll No is required.' };
    }

    // Check duplicate email or institutional ID
    const duplicate = users.find(
      (u) =>
        u.email.toLowerCase() === email ||
        u.institutionalId.toUpperCase() === instId
    );
    if (duplicate) {
      return {
        success: false,
        error: `An account already exists with ${
          duplicate.email.toLowerCase() === email ? 'this email address' : 'this Student ID'
        }. Please sign in.`,
      };
    }

    // Hash the password securely
    let passwordHash = DEFAULT_PASSWORD_HASH;
    if (newUserData.password) {
      passwordHash = await hashPassword(newUserData.password);
    }

    // SECURITY ENFORCEMENT: Self-registration is strictly restricted to STUDENT role.
    const user: User = {
      id: `usr-${Date.now()}`,
      name: newUserData.name.trim(),
      email,
      institutionalId: instId,
      departmentId: newUserData.departmentId || 'dept-acad',
      role: 'STUDENT', // Enforce Student privilege only
      designation: 'Enrolled Student',
      phone: newUserData.phone || '+1 (555) 000-0000',
      passwordHash,
    };

    setUsers((prev) => [user, ...prev]);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');

    return { success: true, user };
  };

  // Logout handler
  const logout = () => {
    if (supabase) {
      void supabase.auth.signOut().then(({ error }) => { if (error) console.error('Sign out failed:', error.message); });
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setActiveTab('auth');
  };

  // Request Creation (Central source of truth)
  const createRequest = (
    serviceId: string,
    formData: Record<string, string>,
    uploadedDocuments: UploadedFile[]
  ): ServiceRequest => {
    if (!currentUser) throw new Error('Authentication required');
    const service = services.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');

    // Generate unique human-readable ID: e.g. SW-2026-0011
    const nextSeq = requests.length + 1;
    const formattedSeq = String(nextSeq).padStart(4, '0');
    const newId = `SW-2026-${formattedSeq}`;
    const now = new Date().toISOString();

    const newRequest: ServiceRequest = {
      id: newId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentRoll: currentUser.institutionalId,
      studentDepartment: currentUser.designation || 'Undergraduate Student',
      serviceId: service.id,
      serviceName: service.name,
      serviceCode: service.code,
      formData,
      uploadedDocuments,
      status: 'Submitted',
      assignedDepartmentId: service.departmentId,
      approverId: service.approverId,
      approverName: service.approverTitle,
      submittedAt: now,
      updatedAt: now,
    };

    // Update shared requests state
    setRequests((prev) => [newRequest, ...prev]);

    // Persist to Supabase when real authentication is configured. Document bytes are
    // intentionally not sent as data URLs; private file storage needs a separate bucket/policy.
    if (supabase) {
      void (async () => {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const authUser = authData.user;
          if (!authUser) throw new Error('Authentication required');
          const { data: dbService, error: serviceError } = await supabase
            .from('services').select('id,name,department').eq('name', service.name).maybeSingle();
          if (serviceError || !dbService) throw new Error(serviceError?.message || 'Service is not configured in the database');
          const safeDocuments = uploadedDocuments.map(({ dataUrl: _dataUrl, ...doc }) => doc);
          const { data: saved, error } = await supabase.from('service_requests').insert({
            student_id: authUser.id,
            service_id: dbService.id,
            description: Object.entries(formData).map(([key, value]) => key + ': ' + value).join('\\n'),
            status: 'submitted',
            service_name: service.name,
            service_code: service.code,
            student_name: currentUser.name,
            student_email: currentUser.email,
            student_roll: currentUser.institutionalId,
            student_department: currentUser.departmentId,
            form_data: formData,
            uploaded_documents: safeDocuments,
            assigned_department_id: dbService.department,
          }).select('id,tracking_number').single();
          if (error) throw error;
          setRequests((prev) => prev.map((request) => request.id === newId
            ? { ...request, databaseId: saved.id }
            : request));
          const { error: historyError } = await supabase.from('request_history').insert({
            request_id: saved.id,
            changed_by: authUser.id,
            old_status: 'draft',
            new_status: 'submitted',
            comment: 'Request submitted for ' + service.name,
          });
          if (historyError) console.error('Request saved but history could not be recorded:', historyError.message);
        } catch (error) {
          console.error('StepWise request was not saved to Supabase:', error);
          window.alert('The request could not be saved to the server. Please try again before leaving this page.');
          setRequests((prev) => prev.filter((request) => request.id !== newId));
        }
      })();
    }

    // Create history event
    const historyEvent: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId: newId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Request Submitted',
      previousStatus: 'Draft',
      newStatus: 'Submitted',
      remarks: `Request submitted for ${service.name}. Documents attached: ${uploadedDocuments.length}.`,
      timestamp: now,
    };
    setHistories((prev) => [historyEvent, ...prev]);

    // Create in-app notifications
    const studentNotif: Notification = {
      id: `notif-${Date.now()}-1`,
      recipientId: currentUser.id,
      requestId: newId,
      title: 'Request Submitted Successfully',
      message: `Your request ${newId} for "${service.name}" has been received and routed to ${service.departmentId.toUpperCase()}.`,
      type: 'submission',
      createdAt: now,
      isRead: false,
    };

    const staffNotif: Notification = {
      id: `notif-${Date.now()}-2`,
      recipientRole: 'STAFF',
      requestId: newId,
      title: 'New Service Request Queued',
      message: `A new request ${newId} (${service.name}) from ${currentUser.name} is ready for document verification.`,
      type: 'submission',
      createdAt: now,
      isRead: false,
    };

    setNotifications((prev) => [studentNotif, staffNotif, ...prev]);

    return newRequest;
  };

  // Staff: Verify Documents
  const verifyDocuments = (requestId: string, remarks: string, forwardToApprover: boolean) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    // Department Staff authorization check
    if (
      currentUser.role !== 'STAFF' &&
      currentUser.role !== 'ADMIN'
    ) {
      alert('Unauthorized: Only department staff or administrators can verify documents.');
      return;
    }

    if (
      currentUser.role === 'STAFF' &&
      target.assignedDepartmentId !== currentUser.departmentId
    ) {
      alert('Unauthorized: You can only verify requests belonging to your assigned department.');
      return;
    }

    if (supabase && target.databaseId) {
      void supabase.rpc('stepwise_staff_update_request', {
        p_request_id: target.databaseId,
        p_action: forwardToApprover ? 'verify' : 'start_verification',
        p_comment: remarks || null,
      }).then(({ error }) => {
        if (error) {
          console.error('Server-side verification failed:', error.message);
          window.alert('The server could not update this request. Refresh and try again.');
        }
      });
    }
    const now = new Date().toISOString();
    const newStatus: RequestStatus = forwardToApprover ? 'Pending Approval' : 'Verified';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              verificationRemarks: remarks,
              assignedStaffId: currentUser.id,
              assignedStaffName: currentUser.name,
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: forwardToApprover ? 'Documents Verified & Forwarded' : 'Documents Verified',
      previousStatus: target.status,
      newStatus,
      remarks,
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);

    const notifStudent: Notification = {
      id: `notif-${Date.now()}-1`,
      recipientId: target.studentId,
      requestId,
      title: forwardToApprover ? 'Request Forwarded for Approval' : 'Documents Verified',
      message: `Staff officer ${currentUser.name} verified your documents for ${requestId}. ${
        forwardToApprover ? 'Forwarded to Approving Authority.' : ''
      }`,
      type: forwardToApprover ? 'forwarded' : 'verification',
      createdAt: now,
      isRead: false,
    };

    const notifApprover: Notification = {
      id: `notif-${Date.now()}-2`,
      recipientRole: 'APPROVER',
      requestId,
      title: 'Action Required: Request Ready for Decision',
      message: `Request ${requestId} (${target.serviceName}) verified by ${currentUser.name} and awaiting your final endorsement.`,
      type: 'forwarded',
      createdAt: now,
      isRead: false,
    };

    setNotifications((prev) => [notifStudent, notifApprover, ...prev]);
  };

  // Staff: Request Additional Information
  const requestAdditionalInfo = (requestId: string, query: string) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    if (
      currentUser.role !== 'STAFF' &&
      currentUser.role !== 'ADMIN'
    ) {
      alert('Unauthorized: Only department staff or administrators can request additional information.');
      return;
    }

    if (
      currentUser.role === 'STAFF' &&
      target.assignedDepartmentId !== currentUser.departmentId
    ) {
      alert('Unauthorized: You can only query requests belonging to your assigned department.');
      return;
    }

    if (supabase && target.databaseId) {
      void supabase.rpc('stepwise_staff_update_request', {
        p_request_id: target.databaseId,
        p_action: 'request_information',
        p_comment: query,
      }).then(({ error }) => {
        if (error) {
          console.error('Server-side information request failed:', error.message);
          window.alert('The server could not update this request. Refresh and try again.');
        }
      });
    }
    const now = new Date().toISOString();
    const newStatus: RequestStatus = 'Additional Information Required';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              additionalInfoQuery: query,
              assignedStaffId: currentUser.id,
              assignedStaffName: currentUser.name,
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Additional Information Requested',
      previousStatus: target.status,
      newStatus,
      remarks: `Officer query: "${query}"`,
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      recipientId: target.studentId,
      requestId,
      title: 'Action Needed: Additional Information Requested',
      message: `Staff query for ${requestId}: "${query}". Please attach missing documents or clarifications.`,
      type: 'info_required',
      createdAt: now,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Student: Submit Additional Information / Documents
  const submitAdditionalInfo = (
    requestId: string,
    responseText: string,
    additionalFiles: UploadedFile[]
  ) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    // Student identity check
    if (currentUser.role === 'STUDENT' && target.studentId !== currentUser.id) {
      alert('Unauthorized: You can only respond to your own service requests.');
      return;
    }

    const now = new Date().toISOString();
    const newStatus: RequestStatus = 'Under Verification';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              additionalInfoResponse: responseText,
              additionalDocuments: [...(r.additionalDocuments || []), ...additionalFiles],
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Additional Information Resubmitted',
      previousStatus: target.status,
      newStatus,
      remarks: `Student note: "${responseText}". Additional files uploaded: ${additionalFiles.length}.`,
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'STAFF',
      requestId,
      title: 'Student Responded to Information Query',
      message: `${currentUser.name} submitted additional documents for ${requestId}. Request returned to verification queue.`,
      type: 'verification',
      createdAt: now,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Approver: Approve Request
  const approveRequest = (requestId: string, remarks: string, markCompleted = true) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    if (currentUser.role !== 'APPROVER' && currentUser.role !== 'ADMIN') {
      alert('Unauthorized: Only authorized Approving Authorities can endorse requests.');
      return;
    }

    if (supabase && target.databaseId) {
      void supabase.rpc('stepwise_approver_decide', {
        p_request_id: target.databaseId,
        p_decision: 'approve',
        p_comment: remarks || null,
      }).then(({ error }) => {
        if (error) {
          console.error('Server-side approval failed:', error.message);
          window.alert('The server could not approve this request. Refresh and try again.');
        }
      });
    }
    const now = new Date().toISOString();
    const newStatus: RequestStatus = markCompleted ? 'Completed' : 'Approved';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              decisionRemarks: remarks,
              approverId: currentUser.id,
              approverName: currentUser.name,
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: markCompleted ? 'Approved & Issued Certificate' : 'Request Endorsed / Approved',
      previousStatus: target.status,
      newStatus,
      remarks: remarks || 'Endorsed and approved according to university guidelines.',
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      recipientId: target.studentId,
      requestId,
      title: 'Request Approved & Completed!',
      message: `Your request ${requestId} (${target.serviceName}) has been approved by ${currentUser.name}. You may now view or download your official stamped document.`,
      type: 'completion',
      createdAt: now,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Approver: Reject Request
  const rejectRequest = (requestId: string, remarks: string) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    if (currentUser.role !== 'APPROVER' && currentUser.role !== 'ADMIN') {
      alert('Unauthorized: Only authorized Approving Authorities can reject requests.');
      return;
    }

    if (supabase && target.databaseId) {
      void supabase.rpc('stepwise_approver_decide', {
        p_request_id: target.databaseId,
        p_decision: 'reject',
        p_comment: remarks,
      }).then(({ error }) => {
        if (error) {
          console.error('Server-side rejection failed:', error.message);
          window.alert('The server could not reject this request. Refresh and try again.');
        }
      });
    }
    const now = new Date().toISOString();
    const newStatus: RequestStatus = 'Rejected';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              decisionRemarks: remarks,
              approverId: currentUser.id,
              approverName: currentUser.name,
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Request Rejected',
      previousStatus: target.status,
      newStatus,
      remarks: remarks || 'Does not fulfill academic or administrative eligibility requirements.',
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      recipientId: target.studentId,
      requestId,
      title: 'Request Decision: Rejected',
      message: `Your request ${requestId} was rejected by ${currentUser.name}. Reason: ${remarks}`,
      type: 'rejection',
      createdAt: now,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Complete Request
  const completeRequest = (requestId: string, remarks = 'Marked completed by administrator') => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Completed',
              updatedAt: now,
            }
          : r
      )
    );

    const historyItem: RequestHistory = {
      id: `hist-${Date.now()}`,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Workflow Marked Completed',
      previousStatus: target.status,
      newStatus: 'Completed',
      remarks,
      timestamp: now,
    };
    setHistories((prev) => [historyItem, ...prev]);
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Service Catalogue Admin Ops
  const updateService = (updated: Service) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Unauthorized: Only administrators can update services.');
      return;
    }
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const createService = (newServiceData: Omit<Service, 'id'>): Service => {
    if (currentUser?.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only administrators can create services.');
    }
    const newService: Service = {
      ...newServiceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [newService, ...prev]);
    return newService;
  };

  const toggleServiceStatus = (serviceId: string) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Unauthorized: Only administrators can enable or disable services.');
      return;
    }
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Reset Prototype Data
  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.HISTORIES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

    const freshUsers = INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: DEFAULT_PASSWORD_HASH,
    }));

    setUsers(freshUsers);
    setCurrentUser(freshUsers[0]);
    setIsAuthenticated(true);
    setRequests(INITIAL_REQUESTS);
    setServices(INITIAL_SERVICES);
    setHistories(INITIAL_HISTORIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('dashboard');
  };

  // Unread notification count for current user role or ID
  const unreadCount = notifications.filter((n) => {
    if (n.isRead) return false;
    if (!currentUser) return false;
    if (n.recipientId && n.recipientId === currentUser.id) return true;
    if (n.recipientRole && n.recipientRole === currentUser.role) return true;
    return false;
  }).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        departments,
        services,
        requests,
        histories,
        notifications,
        activeTab,
        selectedRequestId,
        selectedServiceId,
        unreadCount,
        isWalkthroughOpen,
        isAuthenticated,
        setActiveTab,
        setSelectedRequestId,
        setSelectedServiceId,
        setIsWalkthroughOpen,
        switchRole,
        loginUser,
        registerUser,
        logout,
        createRequest,
        verifyDocuments,
        requestAdditionalInfo,
        submitAdditionalInfo,
        approveRequest,
        rejectRequest,
        completeRequest,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateService,
        createService,
        toggleServiceStatus,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
