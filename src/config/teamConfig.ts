/**
 * StepWise Project Team Identities Configuration
 * 
 * Replace hardcoded placeholder identities with team members.
 * These can be customized dynamically via environment variables:
 * - VITE_TEAM_MEMBER_STUDENT
 * - VITE_TEAM_MEMBER_STAFF
 * - VITE_TEAM_MEMBER_APPROVER
 * - VITE_TEAM_MEMBER_ADMIN
 */

// Safe accessor for browser and Node.js runtimes
const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

export const TEAM_MEMBERS = {
  student: {
    name: getEnv('VITE_TEAM_MEMBER_STUDENT') || 'Devaansh K.',
    role: 'STUDENT',
    title: 'Lead Student Researcher',
    institutionalId: 'CS-2023-042',
    email: getEnv('VITE_TEAM_STUDENT_EMAIL') || 'devaansh.student@campus.edu',
    department: 'dept-acad',
    designation: '3rd Year B.S. Computer Science & Engineering',
    phone: '+1 (555) 345-6789',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  staff: {
    name: getEnv('VITE_TEAM_MEMBER_STAFF') || 'Staff Verification Officer',
    role: 'STAFF',
    title: 'Senior Academic Verification Officer',
    institutionalId: 'EMP-ACAD-204',
    email: getEnv('VITE_TEAM_STAFF_EMAIL') || 'staff.academic@campus.edu',
    department: 'dept-acad',
    designation: 'Senior Academic Verification Officer',
    phone: '+1 (555) 234-5671',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  approver: {
    name: getEnv('VITE_TEAM_MEMBER_APPROVER') || 'Dean of Academic Affairs',
    role: 'APPROVER',
    title: 'Dean of Academic Affairs & Faculty Chair',
    institutionalId: 'EXEC-DEAN-001',
    email: getEnv('VITE_TEAM_APPROVER_EMAIL') || 'dean.academic@campus.edu',
    department: 'dept-acad',
    designation: 'Dean of Academic Affairs & Faculty Chair',
    phone: '+1 (555) 123-4567',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  admin: {
    name: getEnv('VITE_TEAM_MEMBER_ADMIN') || 'University Systems Administrator',
    role: 'ADMIN',
    title: 'University Systems & Administrative Registrar',
    institutionalId: 'ADM-SYS-99',
    email: getEnv('VITE_TEAM_ADMIN_EMAIL') || 'admin.registrar@campus.edu',
    department: 'dept-acad',
    designation: 'University Systems & Administrative Registrar',
    phone: '+1 (555) 999-0001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
} as const;
