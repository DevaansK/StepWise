import React from 'react';
import { Building2, Mail, MapPin, User, ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminDepartments: React.FC = () => {
  const { departments, requests, setActiveTab } = useApp();

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
          {departments.length} Operational Units
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          College Department &amp; Office Directorate
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Directory of academic and administrative units handling student requests and document audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptReqs = requests.filter((r) => r.assignedDepartmentId === dept.id);
          const activeCount = deptReqs.filter(
            (r) => r.status !== 'Completed' && r.status !== 'Rejected'
          ).length;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {dept.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {dept.name}
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{dept.officeLocation}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{dept.contactEmail}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Officer Lead: <strong>{dept.leadName}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{deptReqs.length} total requests</span>
                </span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  {activeCount} active
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
