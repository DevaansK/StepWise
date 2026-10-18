import React from 'react';
import {
  LayoutDashboard,
  Grid,
  Bot,
  PlusCircle,
  FileText,
  Bell,
  User,
  CheckSquare,
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    unreadCount,
    requests,
    setIsWalkthroughOpen,
    logout,
  } = useApp();

  if (!currentUser) return null;

  // Role-specific navigation items
  const getNavItems = () => {
    switch (currentUser.role) {
      case 'STUDENT': {
        const studentPendingCount = requests.filter(
          (r) =>
            r.studentId === currentUser.id &&
            r.status !== 'Completed' &&
            r.status !== 'Rejected'
        ).length;

        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'services', label: 'Browse Services', icon: Grid },
          { id: 'assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
          { id: 'new-request', label: 'New Request', icon: PlusCircle },
          {
            id: 'my-requests',
            label: 'My Requests',
            icon: FileText,
            badge: studentPendingCount > 0 ? studentPendingCount : undefined,
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
          { id: 'profile', label: 'Student Profile', icon: User },
        ];
      }

      case 'STAFF': {
        const deptPendingCount = requests.filter(
          (r) =>
            r.assignedDepartmentId === currentUser.departmentId &&
            (r.status === 'Submitted' ||
              r.status === 'Under Verification' ||
              r.status === 'Additional Information Required')
        ).length;

        return [
          { id: 'staff-assigned', label: 'Staff Dashboard', icon: LayoutDashboard },
          {
            id: 'staff-verification',
            label: 'Verification Queue',
            icon: CheckSquare,
            badge: deptPendingCount > 0 ? deptPendingCount : undefined,
          },
          { id: 'services', label: 'Service Catalogue', icon: Grid },
          { id: 'assistant', label: 'AI Knowledge Base', icon: Bot },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
          { id: 'profile', label: 'Staff Profile', icon: User },
        ];
      }

      case 'APPROVER': {
        const pendingApprovalsCount = requests.filter(
          (r) => r.status === 'Pending Approval' || r.status === 'Verified'
        ).length;

        return [
          {
            id: 'approver-pending',
            label: 'Pending Approvals',
            icon: ShieldCheck,
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          },
          { id: 'approver-history', label: 'Decision History', icon: FileText },
          { id: 'services', label: 'Service Procedures', icon: Grid },
          { id: 'assistant', label: 'AI Policy Assistant', icon: Bot },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
          { id: 'profile', label: 'Dean Profile', icon: User },
        ];
      }

      case 'ADMIN': {
        return [
          { id: 'admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
          { id: 'admin-requests', label: 'All Requests Master', icon: FileText },
          { id: 'admin-services', label: 'Service Catalogue', icon: Grid },
          { id: 'admin-departments', label: 'Departments', icon: Building2 },
          { id: 'admin-users', label: 'Users & Roles', icon: Users },
          { id: 'admin-reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'assistant', label: 'AI Advisor', icon: Bot },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
          { id: 'profile', label: 'Admin Settings', icon: User },
        ];
      }
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-black tracking-tight text-sm shadow-md">
                SW
              </div>
              <div className="leading-tight">
                <span className="font-bold text-white text-base tracking-tight">
                  StepWise
                </span>
                <span className="block text-[10px] text-teal-400 font-mono uppercase tracking-wider">
                  Admin Platform
                </span>
              </div>
            </div>
          </div>

          {/* User role status card */}
          <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-teal-300/80 truncate font-mono">
                  {currentUser.role} · {currentUser.institutionalId}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {currentUser.role === 'STUDENT' && 'Student Portal'}
              {currentUser.role === 'STAFF' && 'Staff Verification'}
              {currentUser.role === 'APPROVER' && 'Executive Approvals'}
              {currentUser.role === 'ADMIN' && 'System Management'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-white'
                          : item.isSpecial
                          ? 'text-teal-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        isActive
                          ? 'bg-white text-indigo-900'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card / Faculty Tour Trigger */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-900 text-xs">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Demo Walkthrough
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              End-to-end 4-role evaluation pathway.
            </p>
            <button
              onClick={() => setIsWalkthroughOpen(true)}
              className="mt-2 w-full py-1 px-2 text-[11px] font-semibold text-center text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded transition-colors"
            >
              Open Guided Demo
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="text-teal-400 font-mono">MIT Campus</span>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
