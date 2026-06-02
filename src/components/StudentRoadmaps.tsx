import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SkillRoadmap, StudentRoadmapProgress, MilestoneProgress, Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Compass, CheckCircle2, Circle, Clock, Flame, BookOpen, ExternalLink, Play, Plus, BookCheck, Hourglass } from 'lucide-react';

export const StudentRoadmaps: React.FC = () => {
  const { profile } = useAuth();
  const [roadmaps, setRoadmaps] = useState<SkillRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<SkillRoadmap | null>(null);
  const [userProgress, setUserProgress] = useState<StudentRoadmapProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourcesMap, setResourcesMap] = useState<{ [id: string]: Resource }>({});

  // Form customizations
  const [learningPace, setLearningPace] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [isActivatingRoadmap, setIsActivatingRoadmap] = useState(false);

  // Time logging modal inputs
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [loggedHoursInput, setLoggedHoursInput] = useState('1.5');
  const [isLoggingHours, setIsLoggingHours] = useState(false);

  // Custom resource addition state
  const [addingResourceToMilestoneId, setAddingResourceToMilestoneId] = useState<string | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceProvider, setNewResourceProvider] = useState('GeeksforGeeks');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceType, setNewResourceType] = useState<'video' | 'article' | 'course' | 'documentation' | 'practice' | 'project'>('article');
  const [isAddingResource, setIsAddingResource] = useState(false);

  // Custom AI roadmap generation state
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmapsAndResources();
  }, [profile]);

  const fetchRoadmapsAndResources = async () => {
    setLoading(true);
    try {
      // 1. Fetch available skill roadmaps
      const querySnap = await getDocs(collection(db, 'skillRoadmaps'));
      const list: SkillRoadmap[] = [];
      querySnap.forEach(d => {
        list.push(d.data() as SkillRoadmap);
      });
      setRoadmaps(list);
      if (list.length > 0) {
        setActiveRoadmap(list[0]);
        if (profile) {
          await syncActiveProgress(list[0].skillId);
        }
      }

      // 2. Fetch resource catalogs
      const resourceSnap = await getDocs(collection(db, 'resources'));
      const rMap: { [id: string]: Resource } = {};
      resourceSnap.forEach(r => {
        const data = r.data() as Resource;
        rMap[data.resourceId] = data;
      });
      setResourcesMap(rMap);

    } catch (err) {
      console.error("Error setting up roadmaps:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncActiveProgress = async (roadmapId: string) => {
    if (!profile) return;
    try {
      const progressId = `${profile.uid}_${roadmapId}`;
      const docRef = doc(db, 'studentRoadmapProgress', progressId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setUserProgress(snapshot.data() as StudentRoadmapProgress);
      } else {
        setUserProgress(null);
      }
    } catch (err) {
      console.error("Error fetching roadmaps progress:", err);
    }
  };

  const handleStartRoadmap = async () => {
    if (!profile || !activeRoadmap) return;
    setIsActivatingRoadmap(true);

    try {
      const progressId = `${profile.uid}_${activeRoadmap.skillId}`;
      
      // Initialize milestones list default tracking structures
      const mProgress: MilestoneProgress[] = [];
      activeRoadmap.stages.forEach(stage => {
        stage.milestones.forEach(m => {
          mProgress.push({
            milestoneId: m.milestoneId,
            status: 'not_started',
            hoursLogged: 0,
            startedDate: null,
            completedDate: null
          });
        });
      });

      const newProgress: StudentRoadmapProgress = {
        progressId,
        studentId: profile.uid,
        roadmapId: activeRoadmap.skillId,
        status: 'in_progress',
        startDate: new Date().toISOString(),
        targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 Day default completion goal
        completionDate: null,
        pace: learningPace,
        milestoneProgress: mProgress,
        totalHoursLogged: 0,
        progressPercentage: 0
      };

      await setDoc(doc(db, 'studentRoadmapProgress', progressId), newProgress);
      setUserProgress(newProgress);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'studentRoadmapProgress');
    } finally {
      setIsActivatingRoadmap(false);
    }
  };

  const handleRoadmapSelect = async (roadmap: SkillRoadmap) => {
    setActiveRoadmap(roadmap);
    if (profile) {
      await syncActiveProgress(roadmap.skillId);
    }
  };

  const handleToggleMilestone = async (mId: string, currentStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!profile || !activeRoadmap || !userProgress) return;

    let nextStatus: 'not_started' | 'in_progress' | 'completed' = 'in_progress';
    if (currentStatus === 'not_started') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'not_started';

    try {
      const updatedProgressList = userProgress.milestoneProgress.map(m => {
        if (m.milestoneId === mId) {
          return {
            ...m,
            status: nextStatus,
            startedDate: nextStatus === 'in_progress' ? new Date().toISOString() : m.startedDate,
            completedDate: nextStatus === 'completed' ? new Date().toISOString() : m.completedDate
          };
        }
        return m;
      });

      // Recalculate percentage complete
      const completedCount = updatedProgressList.filter(m => m.status === 'completed').length;
      const totalCount = updatedProgressList.length;
      const percentage = Math.round((completedCount / totalCount) * 100);

      const dbRef = doc(db, 'studentRoadmapProgress', userProgress.progressId);
      const patch = {
        milestoneProgress: updatedProgressList,
        progressPercentage: percentage,
        status: percentage === 100 ? ('completed' as const) : ('in_progress' as const),
        completionDate: percentage === 100 ? new Date().toISOString() : null
      };

      await setDoc(dbRef, { ...userProgress, ...patch });
      setUserProgress(prev => prev ? { ...prev, ...patch } : null);
    } catch (err) {
      console.error("Error setting milestone checklist:", err);
    }
  };

  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeRoadmap || !userProgress || !selectedMilestoneId) return;
    
    setIsLoggingHours(true);
    const addedHours = parseFloat(loggedHoursInput) || 0;

    try {
      const updatedProgressList = userProgress.milestoneProgress.map(m => {
        if (m.milestoneId === selectedMilestoneId) {
          return {
            ...m,
            hoursLogged: m.hoursLogged + addedHours
          };
        }
        return m;
      });

      const totalHours = updatedProgressList.reduce((sum, item) => sum + item.hoursLogged, 0);

      const dbRef = doc(db, 'studentRoadmapProgress', userProgress.progressId);
      const patch = {
        milestoneProgress: updatedProgressList,
        totalHoursLogged: totalHours
      };

      await setDoc(dbRef, { ...userProgress, ...patch });
      setUserProgress(prev => prev ? { ...prev, ...patch } : null);
      
      setSelectedMilestoneId(null);
      setLoggedHoursInput('1.5');
    } catch (err) {
      console.error("Error logging studied hours:", err);
    } finally {
      setIsLoggingHours(false);
    }
  };

  const handleAddResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeRoadmap || !addingResourceToMilestoneId) return;
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;

    setIsAddingResource(true);
    try {
      const resourceId = `res-user-${Date.now()}`;
      const newResource: Resource = {
        resourceId,
        title: newResourceTitle.trim(),
        description: newResourceDescription.trim() || `Study notes and articles for ${newResourceTitle}`,
        url: newResourceUrl.trim(),
        type: newResourceType,
        skills: [activeRoadmap.skillName],
        difficulty: 'intermediate',
        provider: newResourceProvider.trim() || 'GeeksforGeeks',
        isPaid: false,
        rating: 5.0,
        upvoteCount: 1,
        downvoteCount: 0,
        isCurated: false
      };

      // 1. Write the resource to 'resources' collection
      await setDoc(doc(db, 'resources', resourceId), newResource);

      // 2. Map of stage milestones clone & merge
      const updatedStages = activeRoadmap.stages.map(stage => {
        const updatedMilestones = stage.milestones.map(m => {
          if (m.milestoneId === addingResourceToMilestoneId) {
            return {
              ...m,
              resources: [...(m.resources || []), resourceId]
            };
          }
          return m;
        });
        return {
          ...stage,
          milestones: updatedMilestones
        };
      });

      const updatedRoadmap: SkillRoadmap = {
        ...activeRoadmap,
        stages: updatedStages
      };

      // 3. Write updated roadmap back to Firestore
      await setDoc(doc(db, 'skillRoadmaps', activeRoadmap.skillId), updatedRoadmap);

      // 4. Set state mappings
      setResourcesMap(prev => ({
        ...prev,
        [resourceId]: newResource
      }));
      setActiveRoadmap(updatedRoadmap);
      setRoadmaps(prev => prev.map(r => r.skillId === activeRoadmap.skillId ? updatedRoadmap : r));

      // Reset fields
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceProvider('GeeksforGeeks');
      setNewResourceDescription('');
      setNewResourceType('article');
      setAddingResourceToMilestoneId(null);
    } catch (err) {
      console.error("Error adding custom resource link:", err);
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleGenerateCustomRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillInput.trim() || !profile) return;
    setGeneratingRoadmap(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skillName: customSkillInput.trim() })
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to generate roadmap from server API');
      }

      const { roadmap, resources } = responseData as { roadmap: SkillRoadmap, resources: Resource[] };

      // 1. Write resources to Firestore
      for (const resource of resources) {
        await setDoc(doc(db, 'resources', resource.resourceId), resource);
      }

      // 2. Write roadmap to Firestore
      await setDoc(doc(db, 'skillRoadmaps', roadmap.skillId), roadmap);

      setGenerationSuccess(`Successfully generated and imported syllabus roadmap for "${roadmap.skillName}"!`);
      
      // Update local state list of roadmaps
      setRoadmaps(prev => {
        if (prev.some(rm => rm.skillId === roadmap.skillId)) {
          return prev.map(rm => rm.skillId === roadmap.skillId ? roadmap : rm);
        }
        return [...prev, roadmap];
      });

      // Set newly generated as active
      setActiveRoadmap(roadmap);
      await syncActiveProgress(roadmap.skillId);
      
      // Update resources in local resource map
      setResourcesMap(prev => {
        const next = { ...prev };
        resources.forEach(r => {
          next[r.resourceId] = r;
        });
        return next;
      });

      setCustomSkillInput('');
    } catch (err) {
      console.error("AI Roadmap Generation Error:", err);
      setGenerationError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      
      {/* Skill Explorer and Header */}
      <div className="flex flex-col md:flex-row gap-5 items-center justify-between border-b border-[#2a2a2a] pb-5">
        <div className="space-y-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#c5a059] font-mono">
            <Compass className="h-3.5 w-3.5" /> Curricular Skill Trails
          </span>
          <h2 className="text-2xl font-serif font-light text-white tracking-tight">Structured Path Certifications</h2>
          <p className="text-xs text-[#666]">Self-paced, algorithmic textbook roadmaps aggregated with peer research modules.</p>
        </div>

        {/* Roadmap swapper toolbar buttons */}
        <div className="flex flex-wrap gap-2.5">
          {roadmaps.map(rm => (
            <button
              key={rm.skillId}
              onClick={() => handleRoadmapSelect(rm)}
              className={`rounded px-4 py-2 text-xs font-mono tracking-wider transition-all border cursor-pointer ${
                activeRoadmap?.skillId === rm.skillId 
                ? 'bg-[#c5a059] text-[#0a0a0a] border-[#c5a059] font-bold shadow-sm'
                : 'bg-[#0f0f0f] text-[#888] border-[#222] hover:text-white hover:border-[#333]'
              }`}
            >
              {rm.skillName}
            </button>
          ))}
        </div>
      </div>

      {/* AI Custom Roadmaps Generator Banner */}
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f1f] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#c5a059]" />
            <h3 className="text-sm font-serif font-light text-white uppercase tracking-wider">AI Skill Roadmap Architect</h3>
          </div>
          <span className="self-start rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] text-[#c5a059] tracking-widest uppercase font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            100% Unrestricted Subject Freedom
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#888] leading-relaxed">
            You are completely free to study <strong className="text-neutral-200">absolutely any skill across the spectrum of human knowledge</strong>—whether it is engineering, computing, physical sciences, creative arts, business economics, or languages. No topic limits exist. Enter any subject below, and our system dynamically generates a comprehensive curriculum syllabus loaded with vetted materials.
          </p>
        </div>

        {/* Diverse Multidisciplinary Fast Presets Grid */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#555] font-mono tracking-wider uppercase block">Explore multidisciplinary options:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Data Structures & Algorithms", value: "Data Structures & Algorithms" },
              { label: "Deep Learning & Generative AI", value: "Deep Learning & Generative AI" },
              { label: "Cloud Computing & DevOps", value: "Cloud Computing & DevOps" },
              { label: "UI/UX Design & Typography", value: "UI/UX Design & Typography" },
              { label: "Organic Chemistry", value: "Organic Chemistry" },
              { label: "Financial Accounting & Investing", value: "Financial Accounting & Investing" },
              { label: "Creative Writing & Journalism", value: "Creative Writing & Journalism" },
              { label: "Ancient World History", value: "Ancient World History" },
              { label: "Public Speaking & Debate", value: "Public Speaking & Debate" },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCustomSkillInput(p.value)}
                className={`rounded border px-2.5 py-1 text-[10px] font-mono tracking-tight transition cursor-pointer ${
                  customSkillInput === p.value
                    ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]'
                    : 'bg-[#0a0a0a] text-[#888] border-[#222] hover:text-white hover:border-[#444]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerateCustomRoadmap} className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            type="text"
            placeholder="Search or enter any specific custom skill (e.g., Organic Chemistry, Android Dev, Greek History, Public Speaking...)"
            value={customSkillInput}
            onChange={(e) => setCustomSkillInput(e.target.value)}
            disabled={generatingRoadmap}
            className="flex-1 rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#c5a059] transition disabled:opacity-45"
            required
          />
          <button
            type="submit"
            disabled={generatingRoadmap}
            className="rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black text-xs font-bold font-mono tracking-wider px-5 py-2.5 uppercase transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {generatingRoadmap ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent inline-block" />
                Designing Road...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Generate Roadmap
              </>
            )}
          </button>
        </form>
        {generationError && (
          <p className="text-xs text-rose-450 bg-rose-950/15 border border-rose-950/40 p-2.5 rounded font-mono">
            ⚠️ {generationError}
          </p>
        )}
        {generationSuccess && (
          <p className="text-xs text-emerald-400 bg-emerald-950/15 border border-emerald-950/40 p-2.5 rounded font-mono">
            ✓ {generationSuccess}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a059] border-t-transparent" />
        </div>
      ) : !activeRoadmap ? (
        <div className="rounded-lg border border-dashed border-[#2a2a2a] p-12 text-center text-[#555] bg-[#0f0f0f]">
          No learning roadmaps are active. Seed database collections.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* Left: General roadmap information and Activation parameters */}
          <div className="lg:col-span-4 space-y-6 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#666]">ROADMAP DETAIL SYLLABUS</span>
              <h3 className="text-lg font-serif font-medium text-white">{activeRoadmap.name}</h3>
              <p className="text-xs font-light text-[#888] leading-relaxed">{activeRoadmap.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[#222] pt-4 text-center font-mono text-[10px]">
              <div className="rounded border border-[#222] bg-[#0a0a0a] p-2 text-[#aaa]">
                <span className="font-bold text-[#c5a059] uppercase tracking-wider block">Beginner</span>
                <span className="text-xs font-bold leading-none mt-1 block">{activeRoadmap.estimatedHours.beginner}h</span>
              </div>
              <div className="rounded border border-[#222] bg-[#0a0a0a] p-2 text-[#aaa]">
                <span className="font-bold text-[#c5a059] uppercase tracking-wider block">Inter</span>
                <span className="text-xs font-bold leading-none mt-1 block">{activeRoadmap.estimatedHours.intermediate}h</span>
              </div>
              <div className="rounded border border-[#222] bg-[#0a0a0a] p-2 text-[#aaa]">
                <span className="font-bold text-[#c5a059] uppercase tracking-wider block">Advanced</span>
                <span className="text-xs font-bold leading-none mt-1 block">{activeRoadmap.estimatedHours.advanced}h</span>
              </div>
            </div>

            {/* If Roadmap progress doesn't exist, show configure screen. Otherwise show user log card */}
            {!userProgress ? (
              <div className="rounded bg-[#0a0a0a] border border-[#222] p-4 space-y-4 pt-5">
                <h4 className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Play className="h-3 w-3 fill-[#c5a059] text-[#c5a059]" /> START CURRICULUM TRAIL
                </h4>
                
                <div className="space-y-2.5">
                  <label className="text-[9px] font-bold text-[#666] uppercase tracking-wider block font-mono">Weekly Study Pace Commitment</label>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <button
                      onClick={() => setLearningPace('slow')}
                      className={`rounded border py-1.5 text-[10px] font-bold text-center cursor-pointer transition ${
                        learningPace === 'slow' 
                        ? 'bg-[#c5a059] text-black border-[#c5a059]' 
                        : 'bg-[#0f0f0f] text-[#666] border-[#222] hover:text-white'
                      }`}
                    >
                      Slow (20h)
                    </button>
                    <button
                      onClick={() => setLearningPace('medium')}
                      className={`rounded border py-1.5 text-[10px] font-bold text-center cursor-pointer transition ${
                        learningPace === 'medium' 
                        ? 'bg-[#c5a059] text-black border-[#c5a059]' 
                        : 'bg-[#0f0f0f] text-[#666] border-[#222] hover:text-white'
                      }`}
                    >
                      Norm (30h)
                    </button>
                    <button
                      onClick={() => setLearningPace('fast')}
                      className={`rounded border py-1.5 text-[10px] font-bold text-center cursor-pointer transition ${
                        learningPace === 'fast' 
                        ? 'bg-[#c5a059] text-black border-[#c5a059]' 
                        : 'bg-[#0f0f0f] text-[#666] border-[#222] hover:text-white'
                      }`}
                    >
                      Fast (40h+)
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartRoadmap}
                  disabled={isActivatingRoadmap}
                  className="w-full rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black font-bold py-3 text-xs tracking-widest uppercase shadow cursor-pointer transition disabled:opacity-45"
                >
                  {isActivatingRoadmap ? 'Provisioning...' : 'Initiate Timeline'}
                </button>
              </div>
            ) : (
              <div className="rounded bg-[#0a0a0a] border border-emerald-950/40 p-4 space-y-4">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <BookCheck className="h-4 w-4" /> Active Progress Index
                </h4>

                {/* Progress bar percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#888]">
                    <span>SYLLABUS COVERAGE</span>
                    <span className="text-emerald-400">{userProgress.progressPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#141414] rounded-full overflow-hidden border border-[#222]">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      style={{ width: `${userProgress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#1a1a1a] pt-3 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <Hourglass className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#555] uppercase tracking-wider block font-bold leading-none">LOGGED TIMELINE</span>
                      <strong className="text-white font-medium block mt-1">{userProgress.totalHoursLogged} Hours</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#c5a059] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#555] uppercase tracking-wider block font-bold leading-none">STUDY INTENSITY</span>
                      <strong className="text-[#c5a059] font-medium block mt-1 uppercase">{userProgress.pace}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Milestone steps timeline stages */}
          <div className="lg:col-span-8 space-y-8">
            <h3 className="text-base font-serif font-light text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#c5a059]" /> Pathway Milestone Matrix
            </h3>

            {activeRoadmap.stages.map((stage) => (
              <div key={stage.stageName} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#202020] pb-2">
                  <span className="rounded bg-[#141414] border border-[#2a2a2a] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider">
                    {stage.stageName} Stage
                  </span>
                </div>

                <div className="relative border-l border-[#222] pl-6 ml-3 space-y-6">
                  {stage.milestones.map((m) => {
                    // Match interactive status values
                    const milestoneStatus = userProgress?.milestoneProgress.find(p => p.milestoneId === m.milestoneId);
                    const status = milestoneStatus?.status || 'not_started';
                    const loggedMilestoneHours = milestoneStatus?.hoursLogged || 0;

                    return (
                      <div key={m.milestoneId} className="relative group space-y-4 bg-[#0f0f0f] p-5 rounded-lg border border-[#2a2a2a] hover:border-[#c5a059]/20 transition-all">
                        
                        {/* Bullet on timeline */}
                        <div className="absolute -left-[32px] top-6 transition">
                          {status === 'completed' ? (
                            <div className="rounded bg-emerald-950 border border-emerald-500/30 p-1 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          ) : status === 'in_progress' ? (
                            <div className="rounded bg-amber-950 border border-amber-500/30 p-1 text-amber-400 animate-pulse">
                              <Clock className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="rounded bg-[#0a0a0a] border border-[#2a2a2a] p-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-[#333]" />
                            </div>
                          )}
                        </div>

                        {/* Title and indicators */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="text-[9px] font-bold font-mono text-[#666] tracking-widest uppercase">Milestone step #{m.order}</span>
                            <h4 className="font-serif font-medium text-sm text-white mt-0.5">{m.title}</h4>
                          </div>

                          {/* Quick Interactive status toggle button */}
                          {userProgress && (
                            <div className="flex items-center gap-2">
                              {/* Hours logged status indicator */}
                              {loggedMilestoneHours > 0 && (
                                <span className="rounded bg-[#0a0a0a] border border-[#222] px-2 py-1 text-[9px] font-bold text-[#888] font-mono">
                                  {loggedMilestoneHours}h Logged
                                </span>
                              )}
                              
                              <button
                                onClick={() => handleToggleMilestone(m.milestoneId, status)}
                                className={`rounded px-3 py-1 text-[10px] font-mono tracking-wider transition cursor-pointer border ${
                                  status === 'completed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' :
                                  status === 'in_progress' ? 'bg-amber-950/40 text-[#c5a059] border-[#c5a059]/20' :
                                  'bg-[#0a0a0a] text-[#555] border-[#222] hover:text-[#888]'
                                }`}
                              >
                                {status === 'completed' ? '☑ Done' : status === 'in_progress' ? '⏳ Study' : '☐ Open'}
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedMilestoneId(m.milestoneId);
                                  setLoggedHoursInput('1.5');
                                }}
                                className="rounded border border-[#222] bg-[#0a0a0a] hover:bg-[#111] p-1.5 text-[#555] hover:text-[#c5a059] transition cursor-pointer"
                                title="Log studied hours"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#888] leading-relaxed font-light font-sans">{m.description}</p>

                        {/* Specific Learning objectives bullets */}
                        {m.learningObjectives && m.learningObjectives.length > 0 && (
                          <div className="bg-[#0a0a0a] rounded border border-[#202020] p-3.5 space-y-2">
                            <span className="text-[9px] font-bold tracking-widest uppercase text-[#555] block font-mono">ACADEMIC CRITERIA</span>
                            <ul className="text-xs text-[#888] space-y-1.5 pl-4 list-disc font-sans font-light">
                              {m.learningObjectives.map((obj, oIdx) => (
                                <li key={oIdx} className="leading-snug">{obj}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Milestone curated free training playlists resources references */}
                        <div className="space-y-2.5 pt-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold tracking-widest uppercase text-[#c5a059] block font-mono">AGGREGATED SYLLABUS GUIDES</span>
                            <button
                              onClick={() => {
                                setAddingResourceToMilestoneId(m.milestoneId);
                                setNewResourceTitle('');
                                setNewResourceUrl('');
                                setNewResourceProvider('GeeksforGeeks');
                                setNewResourceDescription('');
                                setNewResourceType('article');
                              }}
                              className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold tracking-wider text-[#c5a059] hover:text-white transition duration-150 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Link
                            </button>
                          </div>
                          {m.resources && m.resources.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {m.resources.map((resId) => {
                                const resource = resourcesMap[resId];
                                if (!resource) return null;

                                return (
                                  <a
                                    key={resId}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-3 p-2.5 rounded border border-[#222] hover:border-[#c5a059]/30 bg-[#0a0a0a]/50 hover:bg-[#0a0a0a] transition text-xs group/link"
                                  >
                                    <div className="min-w-0">
                                      <span className="font-serif font-light text-white line-clamp-1 group-hover/link:text-[#c5a059] transition-colors">{resource.title}</span>
                                      <span className="text-[8px] text-[#555] font-mono mt-1 block tracking-widest uppercase">{resource.provider} • {resource.type}</span>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-[#444] group-hover/link:text-[#c5a059] shrink-0 transition-colors" />
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-[#555] italic font-mono uppercase">No logged learning links yet. Supplement with GeeksforGeeks or web notes!</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Log studied time overlay modal */}
      {selectedMilestoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-2xl relative space-y-4 text-[#d1d1d1]">
            <button 
              onClick={() => setSelectedMilestoneId(null)}
              className="absolute top-4 right-4 rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-mono text-[#555] hover:text-white hover:border-[#c5a059]/40 cursor-pointer"
            >
              ✕
            </button>

            <h4 className="font-serif font-light text-white text-base flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#c5a059]" /> Log Study Core Hours
            </h4>
            <p className="text-xs text-[#666]">Record precise hours dedicated to the current syllabus node.</p>

            <form onSubmit={handleLogHoursSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest block font-mono">DEDICATED CREDIT HOURS</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={loggedHoursInput}
                  onChange={(e) => setLoggedHoursInput(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestoneId(null)}
                  className="flex-1 rounded border border-[#222] bg-[#0a0a0a] py-2 text-xs font-mono font-bold text-[#555] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingHours}
                  className="flex-1 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition"
                >
                  {isLoggingHours ? 'Saving...' : 'Add Session Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Resource Note & Learning Link Portal Modal */}
      {addingResourceToMilestoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-2xl relative space-y-4 text-[#d1d1d1]">
            <button 
              onClick={() => setAddingResourceToMilestoneId(null)}
              className="absolute top-4 right-4 rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-mono text-[#555] hover:text-white hover:border-[#c5a059]/40 cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#c5a059] font-mono tracking-widest uppercase">SYLLABUS ENHANCEMENT</span>
              <h4 className="font-serif font-light text-white text-base flex items-center gap-1.5">
                <BookOpen className="h-4.5 w-4.5 text-[#c5a059]" /> Add Study Resource Note
              </h4>
              <p className="text-xs text-[#888]">Suggest external learning guides, notes (e.g. GeeksforGeeks, MDN, Dev.to), articles or standard tutorials.</p>
            </div>

            <form onSubmit={handleAddResourceSubmit} className="space-y-4 pt-1 font-sans">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Resource & Notes Title</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Python Loops & Iterations Guide"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Provider Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. GeeksforGeeks, MDN, freeCodeCamp"
                    value={newResourceProvider}
                    onChange={(e) => setNewResourceProvider(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Material Type</label>
                  <select
                    value={newResourceType}
                    onChange={(e) => setNewResourceType(e.target.value as any)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white focus:outline-none focus:border-[#c5a059] cursor-pointer"
                  >
                    <option value="article">Study Note / Article</option>
                    <option value="documentation">Official Documentation</option>
                    <option value="video">Video Playlist</option>
                    <option value="course">Standard Course</option>
                    <option value="practice">Interactive Practice</option>
                    <option value="project">Coded Project</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Full URL Link</label>
                <input
                  type="url"
                  placeholder="https://www.geeksforgeeks.org/python-loops..."
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Core Summary Description (Optional)</label>
                <textarea
                  placeholder="Provide a quick outline of elements covered in this material to assist fellow students..."
                  value={newResourceDescription}
                  onChange={(e) => setNewResourceDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddingResourceToMilestoneId(null)}
                  className="flex-1 rounded border border-[#222] bg-[#0a0a0a] py-2 text-xs font-mono font-bold text-[#555] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingResource}
                  className="flex-1 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition"
                >
                  {isAddingResource ? 'Analyzing Link...' : 'Publish Study Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
