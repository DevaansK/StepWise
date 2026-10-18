import React, { useState } from 'react';
import { Users, Search, ArrowLeft, UserCheck, Shield, GraduationCap, FileCheck2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';

export const AdminUsers: React.FC = () => {
  const { users, currentUser, switchRole, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.institutionalId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('admin-dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          {users.length} Registered Accounts
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Users &amp; Roles Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of campus users across all 4 operational roles (Student, Staff, Approving Authority, Admin).
          </p>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, institutional ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="STAFF">Department Staff</option>
              <option value="APPROVER">Approving Authority</option>
              <option value="ADMIN">System Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Institutional ID</th>
                <th className="px-6 py-3.5">Designation / Standing</th>
                <th className="px-6 py-3.5">System Role</th>
                <th className="px-6 py-3.5 text-right">Switch Perspective</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {u.institutionalId}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {u.designation || 'Campus Member'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role === 'STUDENT' && <GraduationCap className="w-3 h-3 text-indigo-700" />}
                        {u.role === 'STAFF' && <FileCheck2 className="w-3 h-3 text-amber-700" />}
                        {u.role === 'APPROVER' && <Shield className="w-3 h-3 text-teal-700" />}
                        {u.role === 'ADMIN' && <UserCheck className="w-3 h-3 text-slate-700" />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Current Active
                        </span>
                      ) : (
                        <button
                          onClick={() => switchRole(u.role, u.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                        >
                          Switch to User
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
