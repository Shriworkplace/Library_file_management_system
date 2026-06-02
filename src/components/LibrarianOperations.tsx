import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Issue, IssueRequest, Fine, Book, UserProfile } from '../types';
import { AlertCircle, CheckCircle2, XCircle, BookOpen, Clock, Activity, User, CreditCard, ShieldAlert, GraduationCap, Search, Trash2 } from 'lucide-react';

export const LibrarianOperations: React.FC = () => {
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<Issue[]>([]);
  const [finesList, setFinesList] = useState<Fine[]>([]);
  const [booksMap, setBooksMap] = useState<{ [id: string]: Book }>({});
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<{ [uid: string]: UserProfile }>({});
  const [pendingStudents, setPendingStudents] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterDept, setStudentFilterDept] = useState('All');
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);

  const filteredStudents = allStudents.filter(student => {
    const sName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const sEmail = (student.email || '').toLowerCase();
    const sId = (student.studentId || '').toLowerCase();
    const q = studentSearchQuery.toLowerCase();
    const matchesSearch = sName.includes(q) || sEmail.includes(q) || sId.includes(q);
    const matchesDept = studentFilterDept === 'All' || student.department === studentFilterDept;
    return matchesSearch && matchesDept;
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Books Map
      const bSnap = await getDocs(collection(db, 'books'));
      const bMap: { [id: string]: Book } = {};
      bSnap.forEach(d => {
        bMap[d.id] = d.data() as Book;
      });
      setBooksMap(bMap);

      // 2. Fetch Users Map for Profiles and extract pending logins + all students directory
      const uSnap = await getDocs(collection(db, 'users'));
      const uMap: { [uid: string]: UserProfile } = {};
      const pendingStuds: UserProfile[] = [];
      const studentsList: UserProfile[] = [];
      uSnap.forEach(d => {
        const uProfile = d.data() as UserProfile;
        uMap[d.id] = uProfile;
        if (uProfile.role === 'student') {
          const profileWithUid = { ...uProfile, uid: d.id };
          studentsList.push(profileWithUid);
          if (uProfile.status === 'pending_approval') {
            pendingStuds.push(profileWithUid);
          }
        }
      });
      setUsersMap(uMap);
      setPendingStudents(pendingStuds);
      setAllStudents(studentsList);

      // 3. Fetch Pending Issue Requests
      const reqSnap = await getDocs(collection(db, 'issueRequests'));
      const reqList: IssueRequest[] = [];
      reqSnap.forEach(d => {
        const item = { id: d.id, ...d.data() } as any;
        if (item.status === 'pending') {
          reqList.push(item);
        }
      });
      setRequests(reqList);

      // 4. Fetch Active Loans (Issues)
      const issueSnap = await getDocs(collection(db, 'issues'));
      const activeList: Issue[] = [];
      issueSnap.forEach(d => {
        const item = { id: d.id, ...d.data() } as any;
        if (item.status === 'active' || item.status === 'overdue') {
          activeList.push(item);
        }
      });
      setActiveLoans(activeList);

      // 5. Fetch Fines
      const finesSnap = await getDocs(collection(db, 'fines'));
      const fList: Fine[] = [];
      finesSnap.forEach(d => {
        fList.push({ id: d.id, ...d.data() } as any);
      });
      setFinesList(fList);

    } catch (err) {
      console.error("Ops Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (req: IssueRequest) => {
    try {
      // 1. Check if Book copies are available
      const book = booksMap[req.bookId];
      if (!book) return;

      if (book.availableCopies <= 0) {
        setFeedback({ type: 'error', text: 'Insufficient book copies available in inventory. Cannot approve!' });
        return;
      }

      // 2. Instantiate an Issue document under 'issues'
      const issueId = `iss-${Date.now()}`;
      const copyId = `${book.bookId}-copy-1`; // Maps to standard copy index
      const issueDate = new Date().toISOString();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days duration default policy

      const issueData: Issue = {
        issueId,
        studentId: req.studentId,
        bookId: req.bookId,
        copyId,
        issueDate,
        dueDate,
        returnDate: null,
        renewalCount: 0,
        fineAmount: 0,
        status: 'active',
        approvedBy: 'librarian'
      };

      await addDoc(collection(db, 'issues'), issueData);

      // 3. Update book availability copies
      const bookRef = doc(db, 'books', req.bookId);
      await updateDoc(bookRef, {
        availableCopies: book.availableCopies - 1,
        circulationCount: book.circulationCount + 1
      });

      // 4. Update request status to 'approved'
      const reqRef = doc(db, 'issueRequests', (req as any).id);
      await updateDoc(reqRef, { status: 'approved' });

      setFeedback({ type: 'success', text: 'Issue request successfully approved and processed!' });
      fetchOperationsData();

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'issues');
    }
  };

  const handleRejectRequest = async (req: IssueRequest, reason = "Fines limit or unavailable copies") => {
    try {
      const dbRef = doc(db, 'issueRequests', (req as any).id);
      await updateDoc(dbRef, {
        status: 'rejected',
        rejectionReason: reason
      });

      setFeedback({ type: 'success', text: 'Request successfully rejected.' });
      fetchOperationsData();
    } catch (err) {
      console.error("Rejection error:", err);
    }
  };

  const handleConfirmReturn = async (issue: Issue) => {
    try {
      const issueRef = doc(db, 'issues', (issue as any).id);
      const today = new Date();
      const dueDateObj = new Date(issue.dueDate);

      // 1. Check if overdue to create Fines document
      let accruedFine = 0;
      if (today > dueDateObj) {
        const diffTime = Math.abs(today.getTime() - dueDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        accruedFine = diffDays * 5; // ₹5 daily fine amount
      }

      // Close rental status
      await updateDoc(issueRef, {
        status: 'returned',
        returnDate: today.toISOString(),
        fineAmount: accruedFine
      });

      // 2. Increment books available copies back
      const book = booksMap[issue.bookId];
      if (book) {
        await updateDoc(doc(db, 'books', issue.bookId), {
          availableCopies: book.availableCopies + 1
        });
      }

      // 3. Create Fine documents inside database if balance exists
      if (accruedFine > 0) {
        const fineId = `fine-${Date.now()}`;
        const newFine: Fine = {
          fineId,
          studentId: issue.studentId,
          issueId: issue.issueId,
          amount: accruedFine,
          reason: 'overdue',
          status: 'due',
          createdAt: today.toISOString()
        };
        await addDoc(collection(db, 'fines'), newFine);
      }

      setFeedback({ type: 'success', text: accruedFine > 0 ? `Book returned! Overdue fine of ₹${accruedFine} has been registered.` : 'Book returned successfully!' });
      fetchOperationsData();

    } catch (err) {
      console.error("Return checkin error:", err);
    }
  };

  const handleWaiveFine = async (fineId: string) => {
    try {
      const fineRef = doc(db, 'fines', fineId);
      await updateDoc(fineRef, { status: 'waived' });
      setFeedback({ type: 'success', text: 'Overdue student fine waived by librarian!' });
      fetchOperationsData();
    } catch (err) {
      console.error("Waiving error:", err);
    }
  };

  const handleApproveLogin = async (student: UserProfile) => {
    try {
      const userRef = doc(db, 'users', student.uid);
      await updateDoc(userRef, { status: 'active' });
      setFeedback({ type: 'success', text: `Approved login access for ${student.firstName} ${student.lastName}!` });
      fetchOperationsData();
    } catch (err) {
      console.error("Error approving login:", err);
      setFeedback({ type: 'error', text: "Failed to approve login." });
    }
  };

  const handleRejectLogin = async (student: UserProfile) => {
    try {
      const userRef = doc(db, 'users', student.uid);
      await updateDoc(userRef, { status: 'suspended' });
      setFeedback({ type: 'success', text: `Denied login access for ${student.firstName} ${student.lastName}.` });
      fetchOperationsData();
    } catch (err) {
      console.error("Error denying login:", err);
      setFeedback({ type: 'error', text: "Failed to deny login." });
    }
  };

  const handleUpdateStudentStatus = async (studentId: string, newStatus: 'pending_approval' | 'active' | 'graduated' | 'suspended') => {
    try {
      const userRef = doc(db, 'users', studentId);
      await updateDoc(userRef, { status: newStatus });
      setFeedback({ type: 'success', text: `Successfully updated student status identifier to '${newStatus}'.` });
      fetchOperationsData();
    } catch (err) {
      console.error("Error updating student status:", err);
      setFeedback({ type: 'error', text: "Failed to update student academic status." });
    }
  };

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      
      {/* Upper Alerts toolbar */}
      {feedback && (
        <div className={`rounded-lg border p-4 text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          <span className="font-mono">{feedback.text}</span>
        </div>
      )}

      {/* Main Grid boards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Column Stack of Operations queue and accounts */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Checkout Request Queue */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#c5a059]" />
              <h3 className="text-base font-serif font-light text-white leading-none">
                Checkout Request Queue
              </h3>
              <span className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#c5a059]">
                {requests.length} PENDING
              </span>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center bg-[#0a0a0a] rounded border border-[#222]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-[#555] font-mono text-xs tracking-wider uppercase bg-[#0a0a0a] rounded border border-[#222]">
                Approval stack clear.
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {requests.map(req => {
                  const book = booksMap[req.bookId];
                  const studentProfile = usersMap[req.studentId];
                  if (!book) return null;

                  return (
                    <div key={req.requestId} className="rounded border border-[#222] p-4 space-y-3.5 bg-[#0a0a0a]/60 hover:border-[#2a2a2a] transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-serif font-medium text-sm text-white leading-snug">{book.title}</h4>
                          <span className="text-[10px] text-[#666] font-mono mt-1 block">ISBN: {book.isbn} • Auth: {book.author[0]}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#888] border-y border-[#202020] py-2">
                        <User className="h-3.5 w-3.5 text-[#555] shrink-0" />
                        <div>
                          <span className="font-bold text-neutral-300 block">{studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : "Global Student"}</span>
                          <span className="text-[9px] text-[#555] block tracking-widest font-mono mt-0.5">STUDENT ID: {studentProfile?.studentId || "TEMPORARY-STUDENT"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[9px]">
                        <span className="text-[#555] tracking-wider uppercase">REQUESTED: {new Date(req.requestDate).toLocaleDateString()}</span>
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="rounded bg-[#141414] border border-[#2a2a2a] text-[#888] hover:text-rose-400 hover:border-rose-950 px-3 py-1.5 font-bold uppercase tracking-wider cursor-pointer transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black px-3 py-1.5 font-bold uppercase tracking-wider cursor-pointer transition"
                          >
                            Approve Issues
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Login Approvals */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#c5a059]" />
              <h3 className="text-base font-serif font-light text-white leading-none">
                Student Login Approvals
              </h3>
              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-amber-500">
                {pendingStudents.length} PENDING
              </span>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center bg-[#0a0a0a] rounded border border-[#222]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="text-center py-10 text-[#555] font-mono text-xs tracking-wider uppercase bg-[#0a0a0a] rounded border border-[#222]">
                No pending login approvals.
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                {pendingStudents.map(student => (
                  <div key={student.uid} className="p-4 rounded border border-[#222] bg-[#0a0a0a]/50 hover:border-[#2a2a2a] transition space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif font-medium text-sm text-white leading-snug">
                          {student.firstName} {student.lastName}
                        </h4>
                        <span className="text-[10px] text-[#666] font-mono mt-1 block">
                          Email: <span className="text-[#aaa]">{student.email}</span>
                        </span>
                        <span className="text-[10px] text-[#666] font-mono block">
                          Dept: {student.department || 'Computer Science'} • Sem: {student.semester || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[#202020]">
                      <span className="text-[9px] font-bold text-amber-500 font-mono tracking-widest uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Awaiting Review
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectLogin(student)}
                          className="rounded bg-[#141414] border border-[#2a2a2a] text-[#888] hover:text-rose-400 hover:border-rose-950 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition text-center"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleApproveLogin(student)}
                          className="rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition text-center"
                        >
                          Approve Access
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Active student loans confirmed checkout lists */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Active Loans list */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c5a059]" />
              <h3 className="text-base font-serif font-light text-white leading-none">
                Active Student Book Loans
              </h3>
              <span className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#c5a059]">
                {activeLoans.length} ACTIVE
              </span>
            </div>

            {loading ? (
              <div className="text-center py-6 text-[#555] font-mono text-xs uppercase tracking-widest">Loading loans ledger...</div>
            ) : activeLoans.length === 0 ? (
              <div className="text-center py-12 text-[#555] font-mono text-xs tracking-wider uppercase bg-[#0a0a0a] rounded border border-[#222]">
                No books currently on loan.
              </div>
            ) : (
              <div className="space-y-3 font-sans truncate">
                {activeLoans.map(loan => {
                  const book = booksMap[loan.bookId];
                  const student = usersMap[loan.studentId];
                  if (!book) return null;

                  return (
                    <div key={loan.issueId} className="flex items-center justify-between gap-3 p-3 rounded border border-[#222] bg-[#0a0a0a]/50 hover:border-[#2a2a2a] transition">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-[#c5a059] font-mono tracking-widest uppercase block mb-1">LOAN ID: {loan.issueId}</span>
                        <h5 className="font-serif font-medium text-xs text-white truncate">{book.title}</h5>
                        <p className="text-[9px] text-[#666] truncate leading-none mt-1.5 font-mono">Student: {student ? `${student.firstName} ${student.lastName}` : "Global Learner"} | Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                      </div>

                      <button
                        onClick={() => handleConfirmReturn(loan)}
                        className="rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[9px] py-1.5 px-2.5 uppercase tracking-widest hover:bg-emerald-900 transition cursor-pointer"
                      >
                        Hand-in
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fines Ledger list */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
              <h3 className="text-base font-serif font-light text-white leading-none">
                Fine & Debit Registries
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-6 text-[#555] font-mono text-xs uppercase tracking-widest">Loading fine ledger...</div>
            ) : finesList.length === 0 ? (
              <div className="text-center py-12 text-[#555] font-mono text-xs tracking-wider uppercase bg-[#0a0a0a] rounded border border-[#222]">
                No fines on record.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {finesList.map(fine => {
                  const student = usersMap[fine.studentId];
                  return (
                    <div key={fine.fineId} className="flex items-center justify-between gap-3 p-2.5 rounded border border-[#222] bg-[#0a0a0a]/50 text-xs">
                      <div>
                        <strong className="text-rose-450 font-bold block">₹{fine.amount} • {fine.reason.toUpperCase()}</strong>
                        <span className="text-[10px] text-[#666] block mt-0.5">Target: {student ? `${student.firstName} ${student.lastName}` : "Global Student"}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[9px]">
                        {fine.status === 'due' ? (
                          <>
                            <span className="rounded bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 font-bold text-rose-300 uppercase">DUE</span>
                            <button
                              onClick={() => handleWaiveFine((fine as any).id)}
                              className="rounded bg-[#141414] border border-[#222] text-[#888] hover:text-white px-2 py-0.5 tracking-wider uppercase cursor-pointer"
                            >
                              Waive
                            </button>
                          </>
                        ) : fine.status === 'paid' ? (
                          <span className="rounded bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400 uppercase">PAID</span>
                        ) : (
                          <span className="rounded bg-[#141414] border border-[#222] px-2 py-0.5 font-bold text-[#444] uppercase">WAIVED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Student Access Directory & List */}
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-6 rounded-lg space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-5 w-5 text-[#c5a059]" />
            <div>
              <h3 className="text-lg font-serif font-light text-white leading-tight">
                DBatu Student Enrollment Directory
              </h3>
              <p className="text-[11px] text-[#666] font-light font-mono mt-0.5">
                Total Registered: {allStudents.length} Students
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#555]">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search name, ID, or email..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#c5a059] transition"
              />
            </div>

            {/* Department Select Filter */}
            <select
              value={studentFilterDept}
              onChange={(e) => setStudentFilterDept(e.target.value)}
              className="px-3 py-1.5 bg-[#0a0a0a] border border-[#222] rounded text-xs text-[#d1d1d1] focus:outline-none focus:border-[#c5a059] cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[#555] font-mono text-xs uppercase tracking-widest">Compiling Student database...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-[#555] font-mono text-xs tracking-wider uppercase bg-[#0a0a0a] rounded border border-[#222]">
            No student cohorts match current query constraints.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#222] bg-[#0a0a0a]/35">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0c0c0c] text-neutral-400 font-mono text-[10px] tracking-widest uppercase border-b border-[#222]">
                  <th className="py-3 px-4 font-bold">Student Record</th>
                  <th className="py-3 px-4 font-bold">Branch & Term</th>
                  <th className="py-3 px-4 font-bold">Active Loans</th>
                  <th className="py-3 px-4 font-bold">Unpaid Fines</th>
                  <th className="py-3 px-4 font-bold">Status Badge</th>
                  <th className="py-3 px-4 font-bold text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020] font-sans">
                {filteredStudents.map(student => {
                  const studentLoans = activeLoans.filter(loan => loan.studentId === student.uid);
                  const isOverdue = studentLoans.some(loan => new Date() > new Date(loan.dueDate));
                  const studentFinesSum = finesList
                    .filter(fine => fine.studentId === student.uid && fine.status === 'due')
                    .reduce((sum, f) => sum + f.amount, 0);

                  return (
                    <tr key={student.uid} className="hover:bg-[#0f0f0f]/50 transition duration-150">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4 font-sans">
                        <div>
                          <span className="font-serif font-medium text-white block text-sm">{student.firstName} {student.lastName}</span>
                          <span className="text-[10px] text-[#666] font-mono block mt-0.5">{student.email}</span>
                          <span className="text-[9px] text-[#555] font-mono block tracking-wider uppercase">ID: {student.studentId || 'UNASSIGNED'}</span>
                        </div>
                      </td>

                      {/* Major Dept / Sem */}
                      <td className="py-3.5 px-4 text-neutral-300 font-sans">
                        <div>
                          <span className="block">{student.department || 'Computer Science'}</span>
                          <span className="text-[10px] text-[#555] font-mono block mt-0.5">Semester {student.semester || 1}</span>
                        </div>
                      </td>

                      {/* Active Book Loans */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className={`h-3.5 w-3.5 ${studentLoans.length > 0 ? 'text-[#c5a059]' : 'text-[#444]'}`} />
                          <span className={`font-mono text-xs font-bold ${studentLoans.length > 0 ? 'text-[#c5a059]' : 'text-[#666]'}`}>
                            {studentLoans.length} active
                          </span>
                          {isOverdue && (
                            <span className="rounded bg-rose-950/40 border border-rose-950 px-1.5 py-0.5 text-[8px] font-bold text-rose-400 font-mono tracking-wider uppercase ml-1">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cumulative fine balance */}
                      <td className="py-3.5 px-4">
                        <span className={`font-mono font-bold text-xs ${studentFinesSum > 0 ? 'text-rose-400' : 'text-[#555]'}`}>
                          ₹{studentFinesSum}
                        </span>
                      </td>

                      {/* Status indicator badge */}
                      <td className="py-3.5 px-4">
                        {student.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : student.status === 'pending_approval' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        ) : student.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[9px] font-mono font-bold text-rose-450 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/30 px-2.5 py-0.5 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            Graduated
                          </span>
                        )}
                      </td>

                      {/* Administrative dropdown controls */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={student.status}
                            onChange={(e) => handleUpdateStudentStatus(student.uid, e.target.value as any)}
                            className="bg-[#0c0c0c] border border-[#2a2a2a] rounded px-2.5 py-1 text-[10px] text-neutral-300 hover:text-white hover:border-[#c5a059] transition cursor-pointer focus:outline-none"
                          >
                            <option value="active">Active (Access)</option>
                            <option value="pending_approval">Pending approval</option>
                            <option value="suspended">Suspended (Ban)</option>
                            <option value="graduated">Graduated (Lock)</option>
                          </select>

                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="rounded bg-rose-950/40 hover:bg-rose-950 border border-rose-500/20 hover:border-rose-500 p-1.5 text-rose-400 hover:text-white transition cursor-pointer"
                            title="Delete Student Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded border border-rose-950 bg-[#0f0f0f] p-6 shadow-2xl relative space-y-4 text-[#d1d1d1]">
            <h4 className="font-serif font-light text-rose-400 text-base flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" /> Danger: Delete Student Account
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you absolutely sure you want to permanently delete <strong className="text-white font-medium">{studentToDelete.firstName} {studentToDelete.lastName}</strong> ({studentToDelete.email})? 
              This will revoke all portal access and remove their student record. Historical loan lists and fines should be settled first.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="flex-1 rounded border border-[#222] bg-[#0a0a0a] py-2 text-xs font-mono font-bold text-[#888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'users', studentToDelete.uid));
                    setFeedback({ type: 'success', text: `Successfully deleted student account for ${studentToDelete.firstName} ${studentToDelete.lastName}.` });
                    setStudentToDelete(null);
                    fetchOperationsData();
                  } catch (err) {
                    console.error("Error deleting student account:", err);
                    setFeedback({ type: 'error', text: "Failed to delete student account." });
                  }
                }}
                className="flex-1 rounded bg-rose-600 hover:bg-rose-500 text-white py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
