import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  AlertTriangle,
  Shield,
  Trash2,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Filter notifications relevant to current user
  const relevantNotifs = notifications.filter((n) => {
    if (n.recipientId && n.recipientId === currentUser.id) return true;
    if (n.recipientRole && n.recipientRole === currentUser.role) return true;
    return true; // show system notifications as well
  });

  const filtered = relevantNotifs.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrative Notifications Center
            </h1>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {relevantNotifs.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workflow alerts, status changes, and department information requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 font-medium rounded-md transition-all ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Notifications ({relevantNotifs.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 font-medium rounded-md transition-all ${
            filter === 'unread'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread Only ({relevantNotifs.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No notifications to display</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Updates to your requests and approvals will appear here.
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
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
                }
              }}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                !notif.isRead ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                {notif.type === 'submission' && <Clock className="w-4 h-4 text-blue-600" />}
                {notif.type === 'verification' && <FileCheck2 className="w-4 h-4 text-amber-600" />}
                {notif.type === 'info_required' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                {notif.type === 'forwarded' && <Shield className="w-4 h-4 text-indigo-600" />}
                {notif.type === 'completion' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  {notif.requestId && (
                    <span className="font-mono text-indigo-700 font-semibold inline-flex items-center gap-1 hover:underline">
                      <span>View {notif.requestId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                  {!notif.isRead && (
                    <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
