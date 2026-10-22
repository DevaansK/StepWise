import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Menu,
  Shield,
  FileCheck2,
  GraduationCap,
  ExternalLink,
  LogOut,
  User,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { TEAM_MEMBERS } from '../../config/teamConfig';

interface TopNavProps {
  onToggleMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentUser,
    switchRole,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
    setIsWalkthroughOpen,
    logout,
    isBackendConnected,
    backendProvider,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const rolesList: { role: Role; label: string; desc: string; userName: string }[] = [
    {
      role: 'STUDENT',
      label: 'Student',
      desc: 'Browse, submit requests & track',
      userName: `${TEAM_MEMBERS.student.name} (${TEAM_MEMBERS.student.institutionalId})`,
    },
    {
      role: 'STAFF',
      label: 'Department Staff',
      desc: 'Verify files & query info',
      userName: `${TEAM_MEMBERS.staff.name} (Academic Affairs)`,
    },
    {
      role: 'APPROVER',
      label: 'Approving Authority',
      desc: 'Dean final sign-off & endorsement',
      userName: `${TEAM_MEMBERS.approver.name} (Dean)`,
    },
    {
      role: 'ADMIN',
      label: 'System Admin',
      desc: 'Manage catalog, workflows & analytics',
      userName: `${TEAM_MEMBERS.admin.name} (Registrar)`,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold tracking-tight text-sm shadow-xs">
              <span className="text-teal-400">S</span>W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                  StepWise
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                  Campus Admin OS
                </span>
                <span
                  className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                    isBackendConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-indigo-50/80 text-indigo-700 border-indigo-200'
                  }`}
                  title={`Backend: ${backendProvider}`}
                >
                  <Database className="w-2.5 h-2.5" />
                  <span>{isBackendConnected ? 'Supabase Connected' : 'PostgreSQL Schema Ready'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Metropolitan Institute of Technology
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Walkthrough Guide Button */}
          <button
            onClick={() => setIsWalkthroughOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
            <span className="hidden sm:inline">Demo Walkthrough</span>
            <span className="sm:hidden">Tour</span>
          </button>

          {/* Quick Role Switcher */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-slate-500 font-normal hidden md:inline">Role:</span>
                <span className="font-semibold text-slate-900">
                  {rolesList.find((r) => r.role === currentUser.role)?.label || currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Switch Evaluator Role
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test different dashboard perspectives
                  </p>
                </div>
                <div className="py-1">
                  {rolesList.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchRole(item.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        currentUser.role === item.role ? 'bg-indigo-50/70' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.role === 'STUDENT' && <GraduationCap className="w-4 h-4 text-indigo-700" />}
                        {item.role === 'STAFF' && <FileCheck2 className="w-4 h-4 text-amber-700" />}
                        {item.role === 'APPROVER' && <Shield className="w-4 h-4 text-teal-700" />}
                        {item.role === 'ADMIN' && <UserCheck className="w-4 h-4 text-slate-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900">
                            {item.label}
                          </span>
                          {currentUser.role === item.role && (
                            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{item.userName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.requestId) {
                            if (currentUser.role === 'STAFF') {
                              setActiveTab('staff-verification', notif.requestId);
                            } else {
                              setActiveTab('request-detail', notif.requestId);
                            }
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3.5 text-left cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          !notif.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'submission' && (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
                          {notif.type === 'verification' && (
                            <FileCheck2 className="w-4 h-4 text-amber-600" />
                          )}
                          {notif.type === 'info_required' && (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          )}
                          {notif.type === 'forwarded' && (
                            <Shield className="w-4 h-4 text-indigo-600" />
                          )}
                          {notif.type === 'completion' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {notif.requestId && (
                              <>
                                <span>·</span>
                                <span className="text-indigo-600 font-medium">
                                  {notif.requestId}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setIsNotifOpen(false);
                    }}
                    className="text-xs font-medium text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                  >
                    <span>View all notifications</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill & Dropdown */}
          {currentUser && (
            <div className="relative pl-2 border-l border-slate-200" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors group text-left cursor-pointer"
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-950 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {currentUser.institutionalId}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                      {currentUser.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsWalkthroughOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Demo Walkthrough</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
