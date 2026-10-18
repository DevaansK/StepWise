import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Clock,
  FileCheck,
  Shield,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
  FileText,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Service } from '../../types';

export const ServiceCatalogue: React.FC = () => {
  const { services, departments, setActiveTab, selectedServiceId, setSelectedServiceId } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectingService, setInspectingService] = useState<Service | null>(null);

  // If navigated with a preselected service ID
  React.useEffect(() => {
    if (selectedServiceId) {
      const found = services.find((s) => s.id === selectedServiceId);
      if (found) setInspectingService(found);
    }
  }, [selectedServiceId, services]);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.category));
    return ['all', ...Array.from(set)];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (!srv.isActive) return false;
      const matchesSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'all' || srv.departmentId === selectedDept;
      const matchesCat = selectedCategory === 'all' || srv.category === selectedCategory;

      return matchesSearch && matchesDept && matchesCat;
    });
  }, [services, searchQuery, selectedDept, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                College Administrative Service Catalogue
              </h1>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {filteredServices.length} Available
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse institutional services, verify documentation checklists, and submit digital requests.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('assistant')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Need Advice? Ask AI</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by service name, code, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => c !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Services Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or clear your department and category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDept('all');
              setSelectedCategory('all');
            }}
            className="mt-3 text-xs text-indigo-700 hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((srv) => {
            const dept = departments.find((d) => d.id === srv.departmentId);

            return (
              <div
                key={srv.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between p-5 group"
              >
                <div className="space-y-3">
                  {/* Category & Code kicker */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-indigo-900">{srv.category}</span>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      {srv.code}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Meta items: Dept, Timeline, Docs */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{dept?.name || srv.departmentId}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>~{srv.estimatedProcessingDays} days (estimate)</span>
                      </span>

                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{srv.requiredDocuments.length} doc{srv.requiredDocuments.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setInspectingService(srv)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors text-center"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => setActiveTab('new-request', srv.id)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>Start Request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Service Details Modal */}
      {inspectingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-900 font-semibold">
                  <span>{inspectingService.category}</span>
                  <span>·</span>
                  <span className="font-mono">{inspectingService.code}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {inspectingService.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setInspectingService(null);
                  setSelectedServiceId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Description */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-1">
                  Overview
                </h4>
                <p className="text-slate-800 leading-relaxed">
                  {inspectingService.description}
                </p>
              </div>

              {/* Department & Processing Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Department
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {departments.find((d) => d.id === inspectingService.departmentId)?.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {departments.find((d) => d.id === inspectingService.departmentId)?.officeLocation}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Est. Turnaround
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    ~{inspectingService.estimatedProcessingDays} Business Days
                  </p>
                  <p className="text-[11px] text-slate-400">*Illustrative estimate</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Approver Authority
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {inspectingService.approverTitle}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fee: {inspectingService.fee}
                  </p>
                </div>
              </div>

              {/* Procedure */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
                  Official Administrative Procedure
                </h4>
                <ol className="space-y-2">
                  {inspectingService.procedure.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Required Documents Checklist */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
                  Required Document Checklist
                </h4>
                <div className="space-y-2">
                  {inspectingService.requiredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {doc.name}
                            {doc.mandatory && (
                              <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Mandatory
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {doc.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                        <span>{doc.acceptedFormats.join(', ')}</span>
                        <div>Max {doc.maxSizeMB}MB</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility */}
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-950">
                <span className="font-bold block text-[11px]">Eligibility Criteria:</span>
                <p className="mt-0.5 text-[11px] text-teal-800">{inspectingService.eligibility}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50">
              <span className="text-[11px] text-slate-400">
                * All documents are processed securely under university guidelines.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInspectingService(null);
                    setSelectedServiceId(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const sid = inspectingService.id;
                    setInspectingService(null);
                    setSelectedServiceId(null);
                    setActiveTab('new-request', sid);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Start Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
