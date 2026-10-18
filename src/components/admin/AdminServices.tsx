import React, { useState } from 'react';
import {
  Grid,
  PlusCircle,
  Edit,
  Power,
  Clock,
  CheckCircle2,
  Building,
  Shield,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Service } from '../../types';

export const AdminServices: React.FC = () => {
  const { services, departments, updateService, createService, toggleServiceStatus, setActiveTab } =
    useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state for creating/editing service
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Service['category']>('Certificates');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-acad');
  const [approverTitle, setApproverTitle] = useState('Dean of Academic Affairs');
  const [estimatedProcessingDays, setEstimatedProcessingDays] = useState(2);
  const [procedureStr, setProcedureStr] = useState('Step 1: Application.\nStep 2: Verification.\nStep 3: Dean Approval.');

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCode(`SRV-${Math.floor(100 + Math.random() * 900)}`);
    setCategory('Certificates');
    setDescription('');
    setDepartmentId(departments[0]?.id || 'dept-acad');
    setApproverTitle('Dean of Academic Affairs');
    setEstimatedProcessingDays(3);
    setProcedureStr('1. Submit required student details.\n2. Verification officer reviews records.\n3. Executive signs digital endorsement.');
    setIsAddModalOpen(true);
  };

  const openEditModal = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setCode(srv.code);
    setCategory(srv.category);
    setDescription(srv.description);
    setDepartmentId(srv.departmentId);
    setApproverTitle(srv.approverTitle);
    setEstimatedProcessingDays(srv.estimatedProcessingDays);
    setProcedureStr(srv.procedure.join('\n'));
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !description.trim()) {
      alert('Please fill in all mandatory service fields.');
      return;
    }

    const procedureSteps = procedureStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingService) {
      updateService({
        ...editingService,
        name,
        code,
        category,
        description,
        departmentId,
        approverTitle,
        estimatedProcessingDays: Number(estimatedProcessingDays),
        procedure: procedureSteps,
      });
      alert(`Service "${name}" updated successfully.`);
    } else {
      createService({
        name,
        code,
        category,
        description,
        departmentId,
        approverId: 'usr-approver-dean',
        approverTitle,
        approvalRequired: true,
        estimatedProcessingDays: Number(estimatedProcessingDays),
        fee: 'Free of Charge',
        eligibility: 'All registered college students in good standing.',
        procedure: procedureSteps,
        requiredDocuments: [
          {
            id: `doc-${Date.now()}-1`,
            name: 'College Student ID Card Scan',
            description: 'Valid smart card front and back.',
            mandatory: true,
            acceptedFormats: ['PDF', 'JPG'],
            maxSizeMB: 5,
          },
        ],
        formFields: [
          {
            id: 'purpose',
            label: 'Purpose of Request',
            type: 'text',
            placeholder: 'Reason for requesting this service',
            required: true,
          },
        ],
        isActive: true,
      });
      alert(`New service "${name}" configured and published.`);
    }

    setIsAddModalOpen(false);
  };

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

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-2xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Configure New Service</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Service Catalogue &amp; Workflow Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Define institutional procedures, assign department routing, configure document checklists, and toggle active status.
        </p>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Service Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Assigned Department</th>
                <th className="px-6 py-3.5">Approver</th>
                <th className="px-6 py-3.5">Est. SLA</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {srv.code}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{srv.name}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{srv.description}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-900">
                    {srv.category}
                  </td>
                  <td className="px-6 py-4">
                    {departments.find((d) => d.id === srv.departmentId)?.name || srv.departmentId}
                  </td>
                  <td className="px-6 py-4">
                    {srv.approverTitle}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    ~{srv.estimatedProcessingDays}d
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        srv.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${srv.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{srv.isActive ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(srv)}
                        className="p-1.5 text-slate-600 hover:text-indigo-900 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Service"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleServiceStatus(srv.id)}
                        className={`p-1.5 rounded transition-colors ${
                          srv.isActive
                            ? 'text-emerald-700 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={srv.isActive ? 'Disable Service' : 'Enable Service'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingService ? `Edit Service: ${editingService.name}` : 'Configure New College Service'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Service Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Migration Certificate"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Service Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MC-901"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="Certificates">Certificates</option>
                  <option value="Academic Records">Academic Records</option>
                  <option value="Financial & Accounts">Financial & Accounts</option>
                  <option value="Campus Life & Housing">Campus Life & Housing</option>
                  <option value="Identity & Security">Identity & Security</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive service description for students"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Assigned Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Approving Authority Title</label>
                  <input
                    type="text"
                    value={approverTitle}
                    onChange={(e) => setApproverTitle(e.target.value)}
                    placeholder="e.g. Dean of Academic Affairs"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Estimated Processing Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={estimatedProcessingDays}
                  onChange={(e) => setEstimatedProcessingDays(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Procedure Steps (One per line)
                </label>
                <textarea
                  rows={3}
                  value={procedureStr}
                  onChange={(e) => setProcedureStr(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
