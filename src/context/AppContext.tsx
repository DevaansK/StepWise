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
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { validateMandatoryDocuments } from '../utils/fileValidation';
import {
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  dbFetchRequests,
  dbCreateRequest,
  dbUpdateRequest,
  dbRecordHistory,
  dbCreateNotification,
  dbMarkNotificationRead,
} from '../services/backendApi';

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
  isBackendConnected: boolean;
  backendProvider: string;

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
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session === 'false') return false;
      return true; // default demo session active
    } catch {
      return true;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0]; // Default Student Lead
  });

  // Shared requests dataset (Central Single Source of Truth)
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
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
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HISTORIES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
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
  const isBackendConnected = isSupabaseConfigured();
  const backendProvider = isBackendConnected ? 'Supabase PostgreSQL' : 'Local State Prototype';

  // Load latest shared requests from Supabase PostgreSQL if configured
  useEffect(() => {
    async function loadRemoteData() {
      if (isSupabaseConfigured()) {
        try {
          const remoteRequests = await dbFetchRequests();
          if (remoteRequests && remoteRequests.length > 0) {
            setRequests(remoteRequests);
          }
        } catch (e) {
          console.warn('Initial Supabase fetch error, using local seed:', e);
        }
      }
    }
    loadRemoteData();
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSION, String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(histories));
  }, [histories]);

  useEffect(() => {
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

  // Login handler with Supabase Auth + local validation fallback
  const loginUser = async (emailOrId: string, password?: string): Promise<LoginResult> => {
    const cleanId = emailOrId.trim().toLowerCase();

    // 1. If Supabase is configured and password is provided, attempt Supabase Auth
    if (isSupabaseConfigured() && password) {
      const res = await supabaseSignIn(cleanId, password);
      if (res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        if (res.user.role === 'STUDENT') setActiveTab('dashboard');
        else if (res.user.role === 'STAFF') setActiveTab('staff-assigned');
        else if (res.user.role === 'APPROVER') setActiveTab('approver-pending');
        else if (res.user.role === 'ADMIN') setActiveTab('admin-dashboard');
        return { success: true };
      }
    }

    // 2. Fallback to institutional directory / demo accounts
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

    // SECURITY ENFORCEMENT: Self-registration is strictly restricted to STUDENT role.
    const userRole: Role = 'STUDENT';

    // 1. If Supabase is configured, register via Supabase Auth
    if (isSupabaseConfigured() && newUserData.password) {
      const remoteRes = await supabaseSignUp(email, newUserData.password, {
        name: newUserData.name.trim(),
        institutionalId: instId,
        departmentId: newUserData.departmentId || 'dept-acad',
        role: userRole,
        phone: newUserData.phone,
      });

      if (remoteRes.error) {
        return { success: false, error: remoteRes.error };
      }

      if (remoteRes.user) {
        setUsers((prev) => [remoteRes.user!, ...prev]);
        setCurrentUser(remoteRes.user);
        setIsAuthenticated(true);
        setActiveTab('dashboard');
        return { success: true, user: remoteRes.user };
      }
    }

    // 2. Hash the password securely for prototype persistence
    let passwordHash = DEFAULT_PASSWORD_HASH;
    if (newUserData.password) {
      passwordHash = await hashPassword(newUserData.password);
    }

    const user: User = {
      id: `usr-${Date.now()}`,
      name: newUserData.name.trim(),
      email,
      institutionalId: instId,
      departmentId: newUserData.departmentId || 'dept-acad',
      role: userRole, // Enforce Student privilege only
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
    supabaseSignOut();
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

    // Strict validation: Verify all mandatory documents are attached
    const docValidation = validateMandatoryDocuments(service, uploadedDocuments);
    if (!docValidation.valid) {
      throw new Error(`Cannot submit request: Missing mandatory document(s): ${docValidation.missing.join(', ')}`);
    }

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

    // Asynchronously synchronize to PostgreSQL backend if active
    dbCreateRequest(newRequest).catch((e) => console.warn('Supabase request sync error:', e));
    dbRecordHistory(historyEvent).catch((e) => console.warn('Supabase history sync error:', e));
    dbCreateNotification(studentNotif).catch(() => {});
    dbCreateNotification(staffNotif).catch(() => {});

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

    // Backend sync
    dbUpdateRequest(requestId, {
      status: newStatus,
      verificationRemarks: remarks,
      assignedStaffId: currentUser.id,
      assignedStaffName: currentUser.name,
    }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
    dbCreateNotification(notifStudent).catch(() => {});
    dbCreateNotification(notifApprover).catch(() => {});
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

    // Backend sync
    dbUpdateRequest(requestId, {
      status: newStatus,
      additionalInfoQuery: query,
      assignedStaffId: currentUser.id,
      assignedStaffName: currentUser.name,
    }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
    dbCreateNotification(notif).catch(() => {});
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
    const combinedFiles = [...(target.additionalDocuments || []), ...additionalFiles];

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              additionalInfoResponse: responseText,
              additionalDocuments: combinedFiles,
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

    // Backend sync
    dbUpdateRequest(requestId, {
      status: newStatus,
      additionalInfoResponse: responseText,
      additionalDocuments: combinedFiles,
    }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
    dbCreateNotification(notif).catch(() => {});
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

    // Backend sync
    dbUpdateRequest(requestId, {
      status: newStatus,
      decisionRemarks: remarks,
      approverId: currentUser.id,
      approverName: currentUser.name,
    }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
    dbCreateNotification(notif).catch(() => {});
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

    // Backend sync
    dbUpdateRequest(requestId, {
      status: newStatus,
      decisionRemarks: remarks,
      approverId: currentUser.id,
      approverName: currentUser.name,
    }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
    dbCreateNotification(notif).catch(() => {});
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

    dbUpdateRequest(requestId, { status: 'Completed', decisionRemarks: remarks }).catch(() => {});
    dbRecordHistory(historyItem).catch(() => {});
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    dbMarkNotificationRead(id).catch(() => {});
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
        isBackendConnected,
        backendProvider,
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
