import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, Issue, StudentRoadmapProgress, Fine } from '../types';
import { BarChart, ShieldCheck, HelpCircle, TrendingUp, Settings, DollarSign, Users, Award } from 'lucide-react';

export const LibrarianAnalytics: React.FC = () => {
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [issuesList, setIssuesList] = useState<Issue[]>([]);
  const [progressList, setProgressList] = useState<StudentRoadmapProgress[]>([]);
  const [finesList, setFinesList] = useState<Fine[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Policy Settings
  const [loanDays, setLoanDays] = useState('14');
  const [fineRate, setFineRate] = useState('5');
  const [maxRenewals, setMaxRenewals] = useState('3');
  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const bSnap = await getDocs(collection(db, 'books'));
      const bArr: Book[] = [];
      bSnap.forEach(d => bArr.push(d.data() as Book));
      setBooksList(bArr);

      const iSnap = await getDocs(collection(db, 'issues'));
      const iArr: Issue[] = [];
      iSnap.forEach(d => iArr.push(d.data() as Issue));
      setIssuesList(iArr);

      const pSnap = await getDocs(collection(db, 'studentRoadmapProgress'));
      const pArr: StudentRoadmapProgress[] = [];
      pSnap.forEach(d => pArr.push(d.data() as StudentRoadmapProgress));
      setProgressList(pArr);

      const fSnap = await getDocs(collection(db, 'fines'));
      const fArr: Fine[] = [];
      fSnap.forEach(d => fArr.push(d.data() as Fine));
      setFinesList(fArr);

      const uSnap = await getDocs(collection(db, 'users'));
      setUsersCount(uSnap.size);

    } catch (err) {
      console.error("Analytics fetch issue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaved(true);
    try {
      // Save policy settings inside systemSettings
      await setDoc(doc(db, 'systemSettings', 'LOAN_DURATION_DAYS'), { value: parseInt(loanDays), description: "Default loan days duration limit" });
      await setDoc(doc(db, 'systemSettings', 'FINE_PER_DAY'), { value: parseInt(fineRate), description: "Daily fee fine in Indian Rupees" });
      setTimeout(() => setPolicySaved(false), 2000);
    } catch (err) {
      console.error("Failed to save policy document:", err);
    }
  };

  // Calculations for aggregate metrics
  const activeFinesTotal = finesList.filter(f => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);
  const paidFinesTotal = finesList.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalCirculation = issuesList.length;

  // Aggregate Category counts for borrowing SVG Horizontal bar rendering
  const genreBorrowCount: { [genre: string]: number } = {};
  issuesList.forEach(issue => {
    const matchedBook = booksList.find(b => b.bookId === issue.bookId);
    if (matchedBook) {
      matchedBook.genre.forEach(g => {
        genreBorrowCount[g] = (genreBorrowCount[g] || 0) + 1;
      });
    }
  });

  const genreChartData = Object.entries(genreBorrowCount).map(([genre, count]) => ({ genre, count })).slice(0, 4);

  // Roadmap aggregates tracking vertical bars
  const skillProgressCount: { [id: string]: number } = {};
  progressList.forEach(p => {
    skillProgressCount[p.roadmapId] = (skillProgressCount[p.roadmapId] || 0) + 1;
  });

  const roadmapChartData = Object.entries(skillProgressCount).map(([id, count]) => {
    let readableName = id.replace('roadmap-', '').toUpperCase();
    return { name: readableName, count };
  });

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      
      {/* Upper key statistics cards indicators widgets */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded border border-[#222] bg-[#0f0f0f] p-4 flex items-center gap-3.5">
          <div className="rounded bg-[#c5a059]/10 p-2 text-[#c5a059]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-[#555] font-bold block uppercase tracking-widest font-mono">Registers</span>
            <strong className="text-base font-serif font-medium text-white block mt-0.5">{usersCount} Students</strong>
          </div>
        </div>

        <div className="rounded border border-[#222] bg-[#0f0f0f] p-4 flex items-center gap-3.5">
          <div className="rounded bg-sky-950/40 p-2 text-sky-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-[#555] font-bold block uppercase tracking-widest font-mono">Circulation</span>
            <strong className="text-base font-serif font-medium text-white block mt-0.5">{totalCirculation} Books</strong>
          </div>
        </div>

        <div className="rounded border border-[#222] bg-[#0f0f0f] p-4 flex items-center gap-3.5">
          <div className="rounded bg-rose-950/40 p-2 text-rose-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-[#555] font-bold block uppercase tracking-widest font-mono">Unpaid Fines</span>
            <strong className="text-base font-serif font-medium text-rose-300 block mt-0.5">₹{activeFinesTotal}</strong>
          </div>
        </div>

        <div className="rounded border border-[#222] bg-[#0f0f0f] p-4 flex items-center gap-3.5">
          <div className="rounded bg-emerald-950/40 p-2 text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-[#555] font-bold block uppercase tracking-widest font-mono">Study Paths</span>
            <strong className="text-base font-serif font-medium text-white block mt-0.5">{progressList.length} Units</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left column: SVG visual diagrams analytics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#202020] pb-3">
              <BarChart className="h-4 w-4 text-[#c5a059]" />
              <h3 className="text-xs font-serif font-light text-white uppercase tracking-wider leading-none">Operational Metrics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category Borrowing activity bar chart */}
              <div className="space-y-4">
                <h4 className="text-xs font-serif font-medium text-white">Domain Borrowing Volumes</h4>
                {genreChartData.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#555] border border-dashed border-[#222] rounded bg-[#0a0a0a] font-mono uppercase tracking-wider">No borrowers metrics present.</div>
                ) : (
                  <div className="space-y-3.5 pt-1.5">
                    {genreChartData.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-neutral-400">{item.genre}</span>
                          <span className="text-[#c5a059] font-bold">{item.count} borrows</span>
                        </div>
                        <div className="h-2 w-full bg-[#0a0a0a] border border-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#c5a059] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(197,160,89,0.3)]"
                            style={{ width: `${Math.min((item.count / totalCirculation) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Roadmap enrollments comparison chart */}
              <div className="space-y-4">
                <h4 className="text-xs font-serif font-medium text-white">Student Enrollment Density</h4>
                {roadmapChartData.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#555] border border-dashed border-[#222] rounded bg-[#0a0a0a] font-mono uppercase tracking-wider">No program logs registered yet.</div>
                ) : (
                  <div className="space-y-3.5 pt-1.5">
                    {roadmapChartData.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-neutral-400">{item.name}</span>
                          <span className="text-emerald-400 font-bold">{item.count} students</span>
                        </div>
                        <div className="h-2 w-full bg-[#0a0a0a] border border-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            style={{ width: `${Math.min((item.count / progressList.length) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Global settings policy configure forms */}
        <div className="lg:col-span-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#202020] pb-3">
            <Settings className="h-4 w-4 text-[#c5a059]" />
            <h3 className="text-xs font-serif font-light text-white uppercase tracking-wider leading-none font-mono">Policy Matrix</h3>
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-4 text-xs font-mono font-medium">
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] block uppercase tracking-wider">STANDARD LOAN DAYS LIMIT</label>
              <input
                type="number"
                value={loanDays}
                onChange={(e) => setLoanDays(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] block uppercase tracking-wider">DAILY FEE OVERDUE PENALTY (₹)</label>
              <input
                type="number"
                value={fineRate}
                onChange={(e) => setFineRate(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] block uppercase tracking-wider">MAX RENEWALS ALLOWED</label>
              <input
                type="number"
                value={maxRenewals}
                onChange={(e) => setMaxRenewals(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black font-bold py-2.5 text-xs uppercase tracking-wider cursor-pointer transition shadow"
            >
              Update Policy Variables
            </button>

            {policySaved && (
              <div className="rounded bg-emerald-950/50 text-emerald-400 p-2 text-center text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1.5 justify-center font-mono">
                <ShieldCheck className="h-4 w-4" /> Parameters updated!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
