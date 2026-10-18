import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  GraduationCap,
  Shield,
  FileCheck2,
  UserCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';

interface AuthViewProps {
  onLoginSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { loginUser, registerUser, switchRole, departments } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('alex.chen@campus.edu');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regId, setRegId] = useState('');
  const [regDept, setRegDept] = useState(departments[0]?.id || 'dept-acad');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  const demoAccounts: { role: Role; name: string; id: string; email: string; label: string }[] = [
    {
      role: 'STUDENT',
      name: 'Alex Chen',
      id: 'CS-2023-042',
      email: 'alex.chen@campus.edu',
      label: 'Student Perspective',
    },
    {
      role: 'STAFF',
      name: 'Dr. Meera Patel',
      id: 'EMP-ACAD-204',
      email: 'm.patel@campus.edu',
      label: 'Staff (Academics)',
    },
    {
      role: 'APPROVER',
      name: 'Prof. Robert Vance',
      id: 'EXEC-DEAN-001',
      email: 'dean.academic@campus.edu',
      label: 'Approver (Dean)',
    },
    {
      role: 'ADMIN',
      name: 'Sarah Jenkins',
      id: 'ADM-SYS-99',
      email: 'admin.registrar@campus.edu',
      label: 'System Admin',
    },
  ];

  const handleDemoSelect = (acc: (typeof demoAccounts)[0]) => {
    setLoginIdentifier(acc.email);
    setLoginPassword('password123');
    setLoginError('');
    switchRole(acc.role);
    onLoginSuccess?.();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your institutional email or ID.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    const success = loginUser(loginIdentifier);
    if (success) {
      onLoginSuccess?.();
    } else {
      setLoginError('User ID or password not recognized. Use quick demo accounts below.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim() || !regId.trim() || !regPassword) {
      setRegError('All fields marked with an asterisk are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    registerUser({
      name: regName,
      email: regEmail,
      institutionalId: regId,
      departmentId: regDept,
    });
    onLoginSuccess?.();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-teal-400 flex items-center justify-center font-black text-lg shadow-md">
            SW
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            StepWise
          </span>
        </div>
        <h2 className="text-sm font-semibold text-slate-600">
          College Administrative Service &amp; Workflow Automation
        </h2>
        <p className="text-[11px] text-slate-400 mt-1">
          * Simulated Academic Prototype Environment
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          {/* Fast Demo Role Switcher Shelf */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Quick 1-Click Demo Logins</span>
              <span className="text-[10px] text-teal-700 font-mono font-medium">Evaluator Ready</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoSelect(acc)}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">
                    {acc.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{acc.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Student Registration
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-xs">
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Institutional Email or Student/Staff ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. alex.chen@campus.edu or CS-2023-042"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-indigo-900 focus:ring-indigo-500"
                  />
                  <span>Remember me on this workstation</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Sign In to StepWise</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              {regError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-xs">
                  {regError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">College Email *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Student Roll / ID *</label>
                  <input
                    type="text"
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    placeholder="CS-2023-099"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">College Department</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Confirm Password *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm transition-colors mt-2"
              >
                Register &amp; Access Dashboard
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
