import React from 'react';
import { User, Shield, Building, Mail, Phone, RotateCcw, CheckCircle, Sparkles, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProfileView: React.FC = () => {
  const { currentUser, departments, switchRole, resetToDefaultData, setIsWalkthroughOpen, logout } =
    useApp();

  if (!currentUser) return null;

  const dept = departments.find((d) => d.id === currentUser.departmentId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-indigo-50">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {currentUser.institutionalId} · {currentUser.email}
              </p>
              <p className="text-xs text-slate-700 mt-1 font-medium">
                {currentUser.designation || 'Institutional Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsWalkthroughOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Guided Tour</span>
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium">College Department</span>
            <p className="font-semibold text-slate-900">{dept?.name || currentUser.departmentId}</p>
            <p className="text-[11px] text-slate-500">{dept?.officeLocation}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium">Institutional Contact</span>
            <p className="font-semibold text-slate-900 font-mono">{currentUser.email}</p>
            <p className="text-[11px] text-slate-500">{currentUser.phone || '+1 (555) 234-5678'}</p>
          </div>
        </div>
      </div>

      {/* Role Switching Shortcut Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Evaluator Role Switcher
        </h3>
        <p className="text-xs text-slate-500">
          Quickly switch between all four simulated operational roles in StepWise:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => switchRole('STUDENT')}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              currentUser.role === 'STUDENT'
                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="block font-semibold">Student</span>
            <span className="text-[10px] text-slate-500">Alex Chen</span>
          </button>

          <button
            onClick={() => switchRole('STAFF')}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              currentUser.role === 'STAFF'
                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="block font-semibold">Staff Officer</span>
            <span className="text-[10px] text-slate-500">Dr. Meera Patel</span>
          </button>

          <button
            onClick={() => switchRole('APPROVER')}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              currentUser.role === 'APPROVER'
                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="block font-semibold">Dean Approver</span>
            <span className="text-[10px] text-slate-500">Prof. Robert Vance</span>
          </button>

          <button
            onClick={() => switchRole('ADMIN')}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              currentUser.role === 'ADMIN'
                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="block font-semibold">System Admin</span>
            <span className="text-[10px] text-slate-500">Sarah Jenkins</span>
          </button>
        </div>
      </div>

      {/* Prototype Reset Card */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-950">
            Reset Prototype Demonstration State
          </h3>
          <p className="text-xs text-rose-800/80 mt-0.5">
            Reset local browser storage to pristine initial sample records, clearing any new submissions or status updates.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all demo data back to default sample state?')) {
              resetToDefaultData();
              alert('Prototype data reset to initial demo state!');
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Data</span>
        </button>
      </div>
    </div>
  );
};
