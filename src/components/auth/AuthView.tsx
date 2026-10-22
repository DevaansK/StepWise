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
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthViewProps {
  onLoginSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { loginUser, registerUser, switchRole, departments } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(isSupabaseConfigured ? '' : 'alex.chen@campus.edu');
  const [loginPassword, setLoginPassword] = useState(isSupabaseConfigured ? '' : 'password123');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regId, setRegId] = useState('');
  const [regDept, setRegDept] = useState(departments[0]?.id || 'dept-acad');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const demoAccounts: {
    role: Role;
    name: string;
    id: string;
    email: string;
    label: string;
    desc: string;
  }[] = [
    {
      role: 'STUDENT',
      name: 'Alex Chen',
      id: 'CS-2023-042',
      email: 'alex.chen@campus.edu',
      label: 'Student',
      desc: 'Submit requests & track',
    },
    {
      role: 'STAFF',
      name: 'Dr. Meera Patel',
      id: 'EMP-ACAD-204',
      email: 'm.patel@campus.edu',
      label: 'Staff Officer',
      desc: 'Verify files & query info',
    },
    {
      role: 'APPROVER',
      name: 'Prof. Robert Vance',
      id: 'EXEC-DEAN-001',
      email: 'dean.academic@campus.edu',
      label: 'Dean Approver',
      desc: 'Executive sign-off & seal',
    },
    {
      role: 'ADMIN',
      name: 'Sarah Jenkins',
      id: 'ADM-SYS-99',
      email: 'admin.registrar@campus.edu',
      label: 'Administrator',
      desc: 'Catalogue & analytics',
    },
  ];

  const handleDemoSelect = async (acc: (typeof demoAccounts)[0]) => {
    if (isSupabaseConfigured) {
      setLoginError('Demo accounts are disabled. Sign in with your registered StepWise account.');
      return;
    }
    setIsLoading(true);
    setLoginIdentifier(acc.email);
    setLoginPassword('password123');
    setLoginError('');
    switchRole(acc.role);
    setIsLoading(false);
    onLoginSuccess?.();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your institutional email or Student/Staff ID.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(loginIdentifier, loginPassword);
      if (result.success) {
        onLoginSuccess?.();
      } else {
        setLoginError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setLoginError('An unexpected login error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    // Validation
    if (!regName.trim()) {
      setRegError('Full Name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('College email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setRegError('Please provide a valid institutional email address (e.g., student@campus.edu).');
      return;
    }
    if (!regId.trim()) {
      setRegError('Student Roll Number or Institutional ID is required.');
      return;
    }
    if (regPassword.length < (isSupabaseConfigured ? 8 : 6)) {
      setRegError(isSupabaseConfigured ? 'Password must be at least 8 characters long.' : 'Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: regName,
        email: regEmail,
        institutionalId: regId,
        departmentId: regDept,
        password: regPassword,
      });

      if (result.success) {
        setRegSuccess('Registration successful! Redirecting to student dashboard...');
        setTimeout(() => {
          onLoginSuccess?.();
        }, 600);
      } else {
        setRegError(result.error || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setRegError('Registration error. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-teal-400 flex items-center justify-center font-black text-lg shadow-md ring-2 ring-indigo-950/20">
            SW
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            StepWise
          </span>
        </div>
        <h2 className="text-sm font-semibold text-slate-700">
          College Administrative Service &amp; Workflow Automation
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Metropolitan Institute of Technology · Unified Campus Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          {/* Fast Demo Role Switcher Shelf */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>1-Click Evaluator Fast Logins</span>
              </span>
              <span className="text-[10px] text-teal-700 font-mono font-semibold">Demo Ready</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Test role-specific permissions and dashboards with pre-seeded data:
            </p>
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoSelect(acc)}
                  className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-white transition-all shadow-2xs group text-left"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      {acc.label}
                    </p>
                    {acc.role === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />}
                    {acc.role === 'STAFF' && <FileCheck2 className="w-3.5 h-3.5 text-amber-700" />}
                    {acc.role === 'APPROVER' && <Shield className="w-3.5 h-3.5 text-teal-700" />}
                    {acc.role === 'ADMIN' && <UserCheck className="w-3.5 h-3.5 text-slate-700" />}
                  </div>
                  <p className="text-[10px] text-slate-700 font-mono font-medium truncate mt-0.5">
                    {acc.name}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">{acc.desc}</p>
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
                setRegError('');
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
                setLoginError('');
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
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
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
                    placeholder="e.g., alex.chen@campus.edu or CS-2023-042"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400 font-mono">Demo: password123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('alex.chen@campus.edu');
                    setLoginPassword('password123');
                  }}
                  className="text-[11px] text-indigo-700 hover:underline"
                >
                  Fill default student
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              {regError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Role Isolation Notice */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <strong>Access Note:</strong> Self-registration creates an authorized <strong>Student</strong> account. Staff and Approver credentials are provisioned by the university administration.
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g., Marcus Brody"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Roll No / ID *</label>
                  <input
                    type="text"
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    placeholder="CS-2024-089"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Department</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block font-semibold text-slate-700">Password (min 6) *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Confirm Password *</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showConfirmPassword}
                    onChange={(e) => setShowConfirmPassword(e.target.checked)}
                    className="rounded text-indigo-900"
                  />
                  <span>Show Passwords</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
