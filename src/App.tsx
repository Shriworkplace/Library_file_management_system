/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentCatalog } from './components/StudentCatalog';
import { StudentLibrary } from './components/StudentLibrary';
import { StudentRoadmaps } from './components/StudentRoadmaps';
import { StudentResearchPapers } from './components/StudentResearchPapers';
import { LibrarianOperations } from './components/LibrarianOperations';
import { LibrarianInventory } from './components/LibrarianInventory';
import { LibrarianAnalytics } from './components/LibrarianAnalytics';
import { BooksAboveLogo } from './components/BooksAboveLogo';
import { Sparkles, Library, BookOpen, GraduationCap, Award, Settings, LogOut, ArrowRightLeft, ShieldCheck, Mail, Activity, Sun, Moon, Clock, FileText } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, profile, loading, logout, setProfileRole, loginWithEmailAndPassword, registerWithEmailAndPassword, refreshProfile } = useAuth();
  
  // Custom Bright / Dark Theme Mode State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('booksabove_theme') as 'dark' | 'light') || 'dark';
  });

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('theme-dark');
    }
    localStorage.setItem('booksabove_theme', theme);
  }, [theme]);

  // Student active tab: 'catalog' | 'shelf' | 'roadmaps' | 'research'
  const [studentTab, setStudentTab] = useState<'catalog' | 'shelf' | 'roadmaps' | 'research'>('catalog');
  // Librarian active tab: 'ops' | 'inventory' | 'analytics'
  const [librarianTab, setLibrarianTab] = useState<'ops' | 'inventory' | 'analytics'>('ops');

  // Custom password & email login states
  const [roleMode, setRoleMode] = useState<'student' | 'librarian'>('student');
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');
  
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('Computer Science');
  const [regSemester, setRegSemester] = useState(1);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailInput.trim() || !loginPasswordInput.trim()) {
      setErrorMsg("Please complete all fields.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginWithEmailAndPassword(loginEmailInput.trim(), loginPasswordInput.trim(), roleMode);
    } catch (err: any) {
      setErrorMsg(err.message || "Credential authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg("Please complete all required fields.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await registerWithEmailAndPassword({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        role: roleMode,
        department: roleMode === 'student' ? regDept : undefined,
        semester: roleMode === 'student' ? Number(regSemester) : undefined
      });
      setSuccessMsg(`Welcome aboard! Account registration complete for ${regFirstName}.`);
      setLoginEmailInput(regEmail.trim());
      setLoginPasswordInput(regPassword.trim());
      setAuthAction('login');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantClick = async (email: string, role: 'student' | 'librarian') => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginWithEmailAndPassword(email, 'password123', role);
    } catch (err: any) {
      setErrorMsg(err.message || "Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#d1d1d1] font-sans">
        <div className="text-center space-y-6">
          <div className="flex justify-center animate-pulse">
            <BooksAboveLogo size="lg" variant="badge" showText={false} />
          </div>
          <p className="text-xs text-[#666] tracking-widest uppercase font-mono">Connecting to manuscript databases...</p>
        </div>
      </div>
    );
  }

  // Not Logged In Gateway Gate (Sophisticated Dark Aesthetics with College ID Restriction)
  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 md:p-8 font-sans text-[#d1d1d1]">
        <div className="w-full max-w-5xl rounded-xl bg-[#0f0f0f] shadow-2xl border border-[#2a2a2a] overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[600px]">
          
          {/* Aesthetic Brand Side-Graphic Panel */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0a0a0a] p-8 text-white flex flex-col justify-between relative overflow-hidden border-r border-[#2a2a2a]">
            {/* Elegant Background Gold Overlay */}
            <div className="absolute top-0 right-0 h-64 w-64 opacity-5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#c5a059] via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 px-3 py-1 text-[10px] font-bold tracking-widest text-[#c5a059] uppercase">
                <Sparkles className="h-3 w-3 text-[#c5a059]" /> Certified Scholastic Portal
              </span>
              <div className="space-y-4 pt-4">
                {/* Beautiful custom branding logo badge matching the uploaded asset */}
                <div className="flex justify-start max-w-xs transition-transform hover:scale-105 duration-300">
                  <BooksAboveLogo size="xl" showText={true} color="#c5a059" />
                </div>
                <div className="w-12 h-0.5 bg-[#c5a059]" />
                <p className="text-[#a0a0a0] text-xs leading-relaxed font-sans font-light">
                  Discover peer textbook ratings, join interactive skill syllabuses, and request academic materials. Secure university access restricted exclusively to recognized College IDs.
                </p>
              </div>
            </div>

            {/* Custom Information Callout inside Brand Bar */}
            <div className="relative z-10 space-y-4">
              <div className="text-[11px] text-[#888] font-serif italic leading-relaxed bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
                "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
                <span className="block text-[#c5a059] font-sans font-bold not-italic mt-2 text-[10px] uppercase tracking-widest">— Brian Herbert</span>
              </div>
              
              <div className="border border-emerald-950/20 bg-emerald-950/5 p-3 rounded text-[10px] text-emerald-400 font-mono leading-relaxed flex items-start gap-1.5">
                <span className="mt-0.5 select-none text-xs">✓</span>
                <span>Enforced Campus Authentication Protocol: Login requires an active Student or Librarian College ID registration.</span>
              </div>
            </div>
          </div>

          {/* Authentication Action Panel */}
          <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between space-y-6 bg-[#0a0a0a]">
            <div className="space-y-4">
              {/* Dual Gateways tabs */}
              <div className="flex border-b border-[#2a2a2a] p-0.5 bg-[#0f0f0f] rounded-lg">
                <button
                  onClick={() => {
                    setRoleMode('student');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-3 text-center text-xs font-mono font-bold tracking-wider uppercase transition rounded duration-200 flex items-center justify-center gap-2 cursor-pointer ${roleMode === 'student' ? 'bg-[#c5a059] text-black shadow' : 'text-[#888] hover:text-[#fff] hover:bg-[#141414]'}`}
                >
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  Student Portal
                </button>
                <button
                  onClick={() => {
                    setRoleMode('librarian');
                    setAuthAction('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-3 text-center text-xs font-mono font-bold tracking-wider uppercase transition rounded duration-200 flex items-center justify-center gap-2 cursor-pointer ${roleMode === 'librarian' ? 'bg-[#c5a059] text-black shadow' : 'text-[#888] hover:text-[#fff] hover:bg-[#141414]'}`}
                >
                  <Library className="h-4 w-4 shrink-0" />
                  Librarian Portal
                </button>
              </div>

              {/* Action tabs: Login vs Register with Theme Switcher */}
              <div className="flex justify-between items-center px-1">
                <div className="space-y-0.5 pr-2">
                  <h3 className="text-lg font-serif text-white tracking-tight">
                    {roleMode === 'student' ? 'Student Workspace Gate' : 'Librarian Workspace Gate'}
                  </h3>
                  <p className="text-[11px] text-[#666] font-light">
                    {authAction === 'login' ? 'Provide your assigned ID to unlock digital assets.' : 'Fill in campus registry variables to issue a new College ID.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* High fidelity Theme Switcher Button */}
                  <button
                    id="gateway-theme-toggle"
                    type="button"
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="p-1.5 rounded border border-[#2a2a2a] bg-[#0f0f0f] text-[#888] hover:text-[#c5a059] hover:bg-[#141414] transition duration-200 cursor-pointer"
                    title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>

                  <div className="flex rounded border border-[#2a2a2a] p-0.5 bg-[#0a0a0a] text-[10px] font-mono">
                    <button
                      onClick={() => { setAuthAction('login'); setErrorMsg(null); }}
                      className={`px-3 py-1 rounded transition cursor-pointer ${authAction === 'login' ? 'bg-[#1a1a1a] text-[#c5a059] font-bold' : 'text-[#666] hover:text-white'}`}
                    >
                      Log In
                    </button>
                    {roleMode === 'student' && (
                      <button
                        onClick={() => { setAuthAction('register'); setErrorMsg(null); }}
                        className={`px-3 py-1 rounded transition cursor-pointer ${authAction === 'register' ? 'bg-[#1a1a1a] text-[#c5a059] font-bold' : 'text-[#666] hover:text-white'}`}
                      >
                        Sign Up
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error and Success message displays */}
              {errorMsg && (
                <div className="text-xs text-rose-450 bg-rose-950/15 border border-rose-950/40 p-3 rounded font-mono leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="text-xs text-emerald-400 bg-emerald-950/15 border border-emerald-950/40 p-3 rounded font-mono leading-relaxed">
                  ✓ {successMsg}
                </div>
              )}

              {/* Form Render */}
              {authAction === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-[#888] font-mono tracking-widest uppercase font-bold">
                      {roleMode === 'student' ? 'Student Email Address' : 'Librarian Email Address'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-[#555]" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={isSubmitting}
                        placeholder={roleMode === 'student' ? 'e.g., arjun@dbatu.ac.in' : 'e.g., sarah@dbatu.ac.in'}
                        value={loginEmailInput}
                        onChange={(e) => setLoginEmailInput(e.target.value)}
                        className="w-full block bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-2.5 pl-10 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition ease-in-out disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-[#888] font-mono tracking-widest uppercase font-bold">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <ShieldCheck className="h-4 w-4 text-[#555]" />
                      </div>
                      <input
                        type="password"
                        required
                        disabled={isSubmitting}
                        placeholder="Enter password"
                        value={loginPasswordInput}
                        onChange={(e) => setLoginPasswordInput(e.target.value)}
                        className="w-full block bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-2.5 pl-10 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition ease-in-out disabled:opacity-50"
                      />
                    </div>
                    <span className="text-[9px] text-[#555] font-mono leading-tight block">Default password for seeded accounts is 'password123'.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !loginEmailInput.trim() || !loginPasswordInput.trim()}
                    className="w-full rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black font-mono font-bold text-xs uppercase tracking-widest py-3 transition shadow cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent inline-block" />
                        Authenticating Pipeline...
                      </>
                    ) : (
                      <>
                        Request Access Passport
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4.5 bg-[#0f0f0f] border border-[#222] p-4.5 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">First Name</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Arjun"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">Last Name</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Sharma"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      placeholder="username@dbatu.ac.in"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">Password</label>
                    <input
                      type="password"
                      required
                      disabled={isSubmitting}
                      placeholder="Choose a password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition disabled:opacity-50"
                    />
                  </div>

                  {roleMode === 'student' && (
                    <div className="grid grid-cols-2 gap-3 border-t border-[#222] pt-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">Department</label>
                        <select
                          value={regDept}
                          disabled={isSubmitting}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-[#d1d1d1] focus:outline-none focus:border-[#c5a059] cursor-pointer"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] text-[#888] font-mono tracking-widest uppercase">Semester</label>
                        <select
                          value={regSemester}
                          disabled={isSubmitting}
                          onChange={(e) => setRegSemester(Number(e.target.value))}
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-xs text-[#d1d1d1] focus:outline-none focus:border-[#c5a059] cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded border border-[#c5a059] bg-[#c5a059]/5 text-[#c5a059] hover:bg-[#c5a059] hover:text-black font-mono font-bold text-xs uppercase tracking-widest py-2.5 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Creating Profile..." : `Register New ${roleMode === 'student' ? 'Student' : 'Librarian'}`}
                  </button>
                </form>
              )}
            </div>

            {/* Instant Access Demo IDs */}
            <div className="border-t border-[#2a2a2a] pt-4.5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#c5a059]" />
                <span className="text-[10px] tracking-widest uppercase text-[#888] font-mono font-bold">Registered Campus Accounts for Testing</span>
              </div>
              <p className="text-[10px] text-[#666] leading-relaxed">
                Click any campus profile below to automatically seed and log into the environment with that account (password: password123):
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {roleMode === 'student' ? (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleInstantClick('arjun@dbatu.ac.in', 'student')}
                      className="rounded bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/40 p-2 text-left hover:bg-[#141414] transition duration-200 group flex flex-col justify-between h-14 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold text-white group-hover:text-[#c5a059] transition-colors line-clamp-1">Arjun Sharma</span>
                      <span className="text-[9px] text-[#555] group-hover:text-[#888] transition-colors font-mono tracking-wider">Email: arjun@dbatu.ac.in</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleInstantClick('priya@dbatu.ac.in', 'student')}
                      className="rounded bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/40 p-2 text-left hover:bg-[#141414] transition duration-200 group flex flex-col justify-between h-14 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold text-white group-hover:text-[#c5a059] transition-colors line-clamp-1">Priya Nair</span>
                      <span className="text-[9px] text-[#555] group-hover:text-[#888] transition-colors font-mono tracking-wider">Email: priya@dbatu.ac.in</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleInstantClick('sarah@dbatu.ac.in', 'librarian')}
                      className="rounded bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/40 p-2 text-left hover:bg-[#141414] transition duration-200 group flex flex-col justify-between h-14 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold text-white group-hover:text-[#c5a059] transition-colors line-clamp-1">Sarah Jenkins</span>
                      <span className="text-[9px] text-[#555] group-hover:text-[#888] transition-colors font-mono tracking-wider">Email: sarah@dbatu.ac.in</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleInstantClick('robert@dbatu.ac.in', 'librarian')}
                      className="rounded bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/40 p-2 text-left hover:bg-[#141414] transition duration-200 group flex flex-col justify-between h-14 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold text-white group-hover:text-[#c5a059] transition-colors line-clamp-1">Robert Mercer</span>
                      <span className="text-[9px] text-[#555] group-hover:text-[#888] transition-colors font-mono tracking-wider">Email: robert@dbatu.ac.in</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // If user is a student awaiting librarian approval
  if (profile && profile.role === 'student' && profile.status === 'pending_approval') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 md:p-8 font-sans text-[#d1d1d1]">
        <div className="w-full max-w-xl rounded-xl bg-[#0f0f0f] shadow-2xl border border-[#2a2a2a] p-6 md:p-10 text-center space-y-8">
          
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-pulse">
            <Clock className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-serif text-white tracking-tight">Login Pending Approval</h2>
            <p className="text-xs text-[#888] max-w-md mx-auto leading-relaxed">
              Your registration with <span className="text-[#c5a059] font-mono">{profile.email}</span> is successful, but your login requires approval from a Librarian.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5 text-left space-y-3 max-w-sm mx-auto">
            <div className="text-[10px] uppercase tracking-widest font-mono text-[#555] border-b border-[#222] pb-1.5 font-bold">Credential Registry</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span className="text-[#666] font-mono">Student:</span>
              <span className="col-span-2 text-white font-medium">{profile.firstName} {profile.lastName}</span>
              
              <span className="text-[#666] font-mono">Email:</span>
              <span className="col-span-2 text-[#aaa] font-mono break-all">{profile.email}</span>

              <span className="text-[#666] font-mono">Major:</span>
              <span className="col-span-2 text-white">{profile.department || 'Computer Science'}</span>

              <span className="text-[#666] font-mono">Branch Status:</span>
              <span className="col-span-2 text-amber-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                Awaiting Librarian
              </span>
            </div>
          </div>

          <div className="space-y-3 max-w-xs mx-auto pt-2">
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await refreshProfile();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black font-mono font-bold text-xs uppercase tracking-widest py-3 transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Check Status
            </button>

            <button
              onClick={logout}
              className="w-full rounded bg-transparent hover:bg-[#141414] border border-[#2a2a2a] text-[#888] hover:text-white font-mono font-bold text-xs uppercase tracking-widest py-3 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" /> Log Out
            </button>
          </div>

          <div className="text-[10px] text-[#555] font-mono border-t border-[#222]/50 pt-5 leading-normal">
            Librarians review registration logs at the "Circulation Desk" tab in DBatu portal.
          </div>

        </div>
      </div>
    );
  }

  // Active Workspace layout
  const isLibrarian = profile.role === 'librarian' || profile.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans text-[#d1d1d1]">
      
      {/* Top Brand Workspace Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
           {/* Logo brand and interactive swap roles selector for debugging */}
           <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="flex items-center gap-3">
               <BooksAboveLogo size="md" color={theme === 'dark' ? '#c5a059' : '#4e5b31'} />
             </div>
           </div>

          {/* Profile details drawer selector */}
          <div className="flex items-center gap-4">
            <div className="text-right sm:block">
              <div className="text-xs font-medium text-white leading-none">{profile.firstName} {profile.lastName}</div>
              <div className="text-[10px] text-[#666] font-medium font-mono mt-1 max-w-[150px] md:max-w-none truncate flex items-center gap-1 justify-end">
                <Mail className="h-2.5 w-2.5 text-[#555]" /> {user.email || 'shrived.work@gmail.com'}
              </div>
            </div>

            {/* Elegant workspace theme toggler */}
            <button
              id="header-theme-toggle"
              type="button"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="rounded border border-[#2a2a2a] bg-[#141414] hover:bg-[#1a1a1a] p-2 text-[#888] hover:text-[#c5a059] transition cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={logout}
              className="rounded border border-[#2a2a2a] bg-[#141414] hover:bg-[#1a1a1a] p-2 text-[#666] hover:text-rose-400 transition cursor-pointer"
              title="Sign Out Account"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary tab workspace panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* If user is active student */}
        {profile.role === 'student' ? (
          <div className="space-y-6">
            {/* View selectors for student dashboard */}
            <div className="flex border-b border-[#2a2a2a] font-mono text-xs gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
              <button
                onClick={() => setStudentTab('catalog')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${studentTab === 'catalog' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <Library className="h-4 w-4 shrink-0" /> Catalog Search
              </button>
              <button
                onClick={() => setStudentTab('shelf')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${studentTab === 'shelf' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <BookOpen className="h-4 w-4 shrink-0" /> Dashboard Shelf
              </button>
              <button
                onClick={() => setStudentTab('roadmaps')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${studentTab === 'roadmaps' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <Award className="h-4 w-4 shrink-0" /> Curriculum Roadmaps
              </button>
              <button
                onClick={() => setStudentTab('research')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${studentTab === 'research' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <FileText className="h-4 w-4 shrink-0" /> Research Papers
              </button>
            </div>

            {/* Body content based on tab selection */}
            {studentTab === 'catalog' && <StudentCatalog />}
            {studentTab === 'shelf' && <StudentLibrary />}
            {studentTab === 'roadmaps' && <StudentRoadmaps />}
            {studentTab === 'research' && <StudentResearchPapers />}
          </div>
        ) : (
          // If user loaded Librarian positions views
          <div className="space-y-6">
            <div className="flex border-b border-[#2a2a2a] font-mono text-xs gap-6">
              <button
                onClick={() => setLibrarianTab('ops')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${librarianTab === 'ops' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <Activity className="h-4 w-4" /> Circulation Desk
              </button>
              <button
                onClick={() => setLibrarianTab('inventory')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${librarianTab === 'inventory' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <Library className="h-4 w-4" /> Inventory Copies
              </button>
              <button
                onClick={() => setLibrarianTab('analytics')}
                className={`pb-3 font-semibold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${librarianTab === 'analytics' ? 'text-[#c5a059] border-[#c5a059]' : 'text-[#666] border-transparent hover:text-[#aaa]'}`}
              >
                <Settings className="h-4 w-4" /> Policies & Analytics
              </button>
            </div>

            {librarianTab === 'ops' && <LibrarianOperations />}
            {librarianTab === 'inventory' && <LibrarianInventory />}
            {librarianTab === 'analytics' && <LibrarianAnalytics />}
          </div>
        )}

      </main>

      {/* Small Humble Policy Credit footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f] py-4 text-center text-[9px] text-[#555] tracking-widest uppercase font-mono font-bold flex items-center justify-center gap-4">
        <span>BooksAbove Ledger Workspace</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
        <span>Secure Securely Handled Live Firestore DB</span>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
