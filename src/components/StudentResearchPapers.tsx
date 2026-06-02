import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ResearchPaper } from '../types';
import { Search, FileText, Download, ExternalLink, Plus, BookOpen, GraduationCap, Calendar, User, Trash2, Check, Landmark, Library } from 'lucide-react';

const INITIAL_PAPERS: ResearchPaper[] = [
  {
    paperId: "arxiv-transformer",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
    abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
    publishedYear: 2017,
    journal: "Advances in Neural Information Processing Systems (NeurIPS)",
    doi: "10.48550/arXiv.1706.03762",
    pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    subjectTags: ["Deep Learning", "Natural Language Processing", "Transformer", "AI"],
    downloadsCount: 142,
    addedBy: "System Curator",
    createdAt: new Date().toISOString()
  },
  {
    paperId: "arxiv-gpt3",
    title: "Language Models are Few-Shot Learners",
    authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder", "Melanie Subbiah", "Jared Kaplan", "Prafulla Dhariwal", "Arvind Neelakantan", "Pranav Shyam", "Girish Sastry", "Amanda Askell", "Sandhini Agarwal", "Ariel Herbert-Voss", "Gretchen Krueger", "Tom Henighan"],
    abstract: "We train GPT-3, an autoregressive language model with 175 billion parameters, 10x more than any previous non-sparse language model, and test its performance in the few-shot setting. We show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.",
    publishedYear: 2020,
    journal: "ArXiv Preprint",
    doi: "10.48550/arXiv.2005.14165",
    pdfUrl: "https://arxiv.org/pdf/2005.14165.pdf",
    subjectTags: ["Generative AI", "Large Language Models", "Deep Learning", "AI"],
    downloadsCount: 98,
    addedBy: "System Curator",
    createdAt: new Date().toISOString()
  },
  {
    paperId: "arxiv-resnet",
    title: "Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from greatly increased depth.",
    publishedYear: 2015,
    journal: "IEEE Conference on Computer Vision and Pattern Recognition (CVPR)",
    doi: "10.1109/CVPR.2016.90",
    pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
    subjectTags: ["Computer Vision", "Residual Networks", "Deep Learning", "AI"],
    downloadsCount: 84,
    addedBy: "System Curator",
    createdAt: new Date().toISOString()
  },
  {
    paperId: "arxiv-neural-align",
    title: "Neural Machine Translation by Jointly Learning to Align and Translate",
    authors: ["Dzmitry Bahdanau", "Kyunghyun Cho", "Yoshua Bengio"],
    abstract: "Neural machine translation is a recently proposed approach to machine translation. In this paper, we conjecture that the use of a fixed-length vector is a bottleneck of improving the performance of this basic encoder-decoder approach, and propose to extend this by allowing a model to automatically search for parts of a source sentence that are relevant to predicting a target word, without having to segment these parts explicitly.",
    publishedYear: 2014,
    journal: "International Conference on Learning Representations (ICLR)",
    doi: "10.48550/arXiv.1409.0473",
    pdfUrl: "https://arxiv.org/pdf/1409.0473.pdf",
    subjectTags: ["Neural Machine Translation", "Attention Mechanism", "NLP"],
    downloadsCount: 57,
    addedBy: "System Curator",
    createdAt: new Date().toISOString()
  }
];

export const StudentResearchPapers: React.FC = () => {
  const { profile } = useAuth();
  
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  
  // Custom paper details modal state
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  
  // Custom resource link add modal state
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newJournal, setNewJournal] = useState('ArXiv Preprint');
  const [newDoi, setNewDoi] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchResearchPapers();
  }, []);

  const fetchResearchPapers = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'researchPapers');
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Automatically seed base academic papers if collection is fresh
        for (const paper of INITIAL_PAPERS) {
          await setDoc(doc(db, 'researchPapers', paper.paperId), paper);
        }
        setPapers(INITIAL_PAPERS);
      } else {
        const list: ResearchPaper[] = [];
        snap.forEach(doc => {
          list.push(doc.data() as ResearchPaper);
        });
        
        // Sort by newest publication year first, then date created
        list.sort((a, b) => b.publishedYear - a.publishedYear);
        setPapers(list);
      }
    } catch (err) {
      console.error("Error fetching research papers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTrack = async (paper: ResearchPaper) => {
    try {
      const paperRef = doc(db, 'researchPapers', paper.paperId);
      const newCount = (paper.downloadsCount || 0) + 1;
      await updateDoc(paperRef, { downloadsCount: newCount });
      
      setPapers(prev => prev.map(p => p.paperId === paper.paperId ? { ...p, downloadsCount: newCount } : p));
      if (selectedPaper && selectedPaper.paperId === paper.paperId) {
        setSelectedPaper(prev => prev ? { ...prev, downloadsCount: newCount } : null);
      }
    } catch (err) {
      console.error("Error updating download count:", err);
    }
  };

  const handleCreatePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPdfUrl.trim() || !newAuthors.trim() || !newAbstract.trim()) {
      setFeedback({ type: 'error', text: 'Please fill in all mandatory research parameters.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const paperId = `paper-${Date.now()}`;
      const authorList = newAuthors.split(',').map(a => a.trim()).filter(a => a.length > 0);
      const tagList = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const newPapa: ResearchPaper = {
        paperId,
        title: newTitle.trim(),
        authors: authorList,
        abstract: newAbstract.trim(),
        publishedYear: Number(newYear) || new Date().getFullYear(),
        journal: newJournal.trim() || 'Preprint Research Archive',
        doi: newDoi.trim() || undefined,
        pdfUrl: newPdfUrl.trim(),
        subjectTags: tagList.length > 0 ? tagList : ["Academic Science"],
        downloadsCount: 0,
        addedBy: profile ? `${profile.firstName} ${profile.lastName}` : 'Anonymous Scholar',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'researchPapers', paperId), newPapa);

      setPapers(prev => [newPapa, ...prev]);
      
      // Reset form variables
      setNewTitle('');
      setNewAuthors('');
      setNewAbstract('');
      setNewYear(new Date().getFullYear());
      setNewJournal('ArXiv Preprint');
      setNewDoi('');
      setNewPdfUrl('');
      setNewTags('');
      
      setIsAddingPaper(false);
      setFeedback({ type: 'success', text: `Research paper "${newPapa.title}" uploaded & cataloged successfully!` });
    } catch (err: any) {
      console.error("Error creating research paper doc:", err);
      setFeedback({ type: 'error', text: 'Failed to broadcast paper to database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!window.confirm("Are you sure you want to delete this research paper metadata from library collection?")) return;
    try {
      await deleteDoc(doc(db, 'researchPapers', paperId));
      setPapers(prev => prev.filter(p => p.paperId !== paperId));
      if (selectedPaper && selectedPaper.paperId === paperId) {
        setSelectedPaper(null);
      }
      setFeedback({ type: 'success', text: 'Research paper successfully removed.' });
    } catch (err) {
      console.error("Failed to delete paper:", err);
      setFeedback({ type: 'error', text: 'Failed to delete research paper.' });
    }
  };

  // Extract all unique tags dynamically
  const uniqueTags = React.useMemo(() => {
    const set = new Set<string>();
    papers.forEach(p => p.subjectTags?.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [papers]);

  // Filters logic
  const filteredPapers = papers.filter(p => {
    const query = searchQuery.toLowerCase();
    const titleMatch = p.title.toLowerCase().includes(query);
    const authorsMatch = p.authors.join(' ').toLowerCase().includes(query);
    const abstractMatch = p.abstract.toLowerCase().includes(query);
    const searchMatch = titleMatch || authorsMatch || abstractMatch;

    const subjectMatch = filterSubject === 'All' || p.subjectTags?.includes(filterSubject);

    return searchMatch && subjectMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Intro Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-[#c5a059] uppercase font-mono mb-2">
            <Landmark className="h-3 w-3" /> Double-Blind Research Network
          </span>
          <h2 className="text-xl font-serif font-light text-white tracking-tight">Academic Research Repository</h2>
          <p className="text-xs text-[#888] mt-1 max-w-xl">
            Retrieve double-blind peer-reviewed conference transcripts, doctoral papers, and landmark computer science reference documentation. Read publications online or download full vector PDFs.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsAddingPaper(true);
          }}
          className="rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Share Publication
        </button>
      </div>

      {feedback && (
        <div className={`text-xs p-3 rounded font-mono leading-relaxed flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/20 text-emerald-405 border border-emerald-950/40' : 'bg-rose-955/20 text-rose-450 border border-rose-955/40'
        }`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠️'} {feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-[10px] hover:text-white px-1.5">✕</button>
        </div>
      )}

      {/* Primary Searching, Scopes and Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* search input bar */}
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#555]" />
          </div>
          <input
            type="text"
            placeholder="Search by paper title, principal investigator, authors or abstract keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition ease-in-out font-sans"
          />
        </div>

        {/* filter tag selection dropdown */}
        <div className="md:col-span-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-2.5 text-xs text-[#d1d1d1] focus:outline-none focus:border-[#c5a059] cursor-pointer font-mono uppercase tracking-wider"
          >
            <option value="All">All Research Disciplines</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Grid displaying papers catalogs */}
      {loading ? (
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-12 text-center text-[#888] space-y-3 font-mono">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent inline-block" />
          <p className="text-xs uppercase tracking-widest">Querying Scholastic Registries...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-12 text-center text-[#555] space-y-2">
          <FileText className="h-10 w-10 mx-auto opacity-30 text-neutral-400" />
          <h4 className="font-serif text-white text-sm">No research transcripts match search variables</h4>
          <p className="text-xs text-[#666] max-w-sm mx-auto">Try widening search criteria or selecting "All Research Disciplines" to refresh scope listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPapers.map((paper) => (
            <div
              key={paper.paperId}
              className="bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#444] transition-all rounded-lg p-5 flex flex-col justify-between space-y-4 hover:shadow-xl relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Meta block tags */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {paper.subjectTags?.map((tag, idx) => (
                      <span key={idx} className="rounded bg-[#1a1a1a] border border-[#222] px-2 py-0.5 text-[8.5px] text-[#c5a059] font-mono tracking-wide uppercase font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[#666] uppercase whitespace-nowrap bg-[#050505] border border-[#222] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> {paper.publishedYear}
                  </span>
                </div>

                {/* Title & journal */}
                <div className="space-y-1">
                  <h3 className="font-serif text-white hover:text-[#c5a059] text-sm break-normal leading-snug cursor-pointer font-medium transition" onClick={() => setSelectedPaper(paper)}>
                    {paper.title}
                  </h3>
                  <p className="text-[10px] text-[#c5a059]/80 font-mono tracking-tight font-medium italic truncate">{paper.journal}</p>
                </div>

                {/* Authors list block */}
                <div className="text-[10px] text-[#aaa] font-sans font-light line-clamp-1 flex items-center gap-1">
                  <User className="h-3 w-3 text-[#666] shrink-0" /> {paper.authors.join(', ')}
                </div>

                {/* short abstract summary */}
                <p className="text-xs text-[#888] leading-relaxed line-clamp-3 font-light pt-1">
                  {paper.abstract}
                </p>
              </div>

              {/* Action layout controls */}
              <div className="border-t border-[#1f1f1f] pt-4.5 flex items-center justify-between gap-3 bg-[#0f0f0f] mt-1 shrink-0">
                <span className="text-[9px] font-mono text-[#555] uppercase font-bold tracking-wider">
                  Downloads: <strong className="text-neutral-300">{paper.downloadsCount || 0}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPaper(paper)}
                    className="rounded bg-[#161616] hover:bg-[#222] border border-[#2a2a2a] text-white px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen className="h-3 w-3" /> Abstract
                  </button>
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownloadTrack(paper)}
                    className="rounded bg-[#c5a059]/10 hover:bg-[#c5a059] text-[#c5a059] hover:text-black border border-[#c5a059]/30 hover:border-transparent px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition"
                  >
                    <Download className="h-3 w-3" /> Download PDF
                  </a>

                  {/* Let privileged staff delete reference notes */}
                  {(profile?.role === 'librarian' || profile?.role === 'admin') && (
                    <button
                      onClick={() => handleDeletePaper(paper.paperId)}
                      className="rounded bg-rose-950/20 hover:bg-rose-950 border border-rose-900/40 p-1.5 text-rose-400 hover:text-white transition cursor-pointer"
                      title="Remove Reference Metadata"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Dynamic Drawer Modal displaying Complete abstract and peer review notes */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] shadow-2xl relative text-[#d1d1d1] flex flex-col h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh]">
            
            {/* Header portion */}
            <div className="p-6 border-b border-[#2a2a2a] space-y-3 shrink-0">
              <button
                onClick={() => setSelectedPaper(null)}
                className="absolute top-4 right-4 rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-mono text-[#555] hover:text-white hover:border-[#c5a059]/40 cursor-pointer z-10"
              >
                ✕
              </button>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2 py-0.5 text-[8px] text-[#c5a059] font-mono tracking-widest uppercase font-bold">
                  Academic Paper
                </span>
                <span className="text-[9px] font-mono text-[#666] tracking-wider uppercase font-semibold">
                  Published: {selectedPaper.publishedYear} in {selectedPaper.journal}
                </span>
              </div>

              <h3 className="font-serif font-light text-white text-lg leading-snug pr-8">{selectedPaper.title}</h3>
              
              <div className="text-xs text-[#aaa] font-light flex items-start gap-1">
                <span className="font-semibold text-neutral-400 shrink-0">Principal Researchers:</span> {selectedPaper.authors.join(', ')}
              </div>
            </div>

            {/* Scrollable scroll portion */}
            <div className="p-6 overflow-y-auto space-y-5 font-sans flex-1">
              
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase font-bold">Abstract Summary</h4>
                <p className="text-xs text-[#a0a0a0] leading-relaxed font-sans font-light italic bg-[#050505] p-3.5 border border-[#1f1f1f] rounded-lg">
                  "{selectedPaper.abstract}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1f1f1f] pt-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#555] font-mono uppercase block font-bold">Digital Object ID (DOI)</span>
                  <span className="text-neutral-300 font-mono text-xs">{selectedPaper.doi || 'N/A Academic Deposit'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#555] font-mono uppercase block font-bold">Repository Curator</span>
                  <span className="text-neutral-300 font-mono text-xs">{selectedPaper.addedBy || 'Central Database'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-[#555] font-mono uppercase block font-bold">Research Subjects</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.subjectTags?.map((t, i) => (
                    <span key={i} className="rounded bg-[#0a0a0a] border border-[#222] px-2.5 py-1 text-[10px] text-neutral-400 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky bottom panel controls */}
            <div className="p-5 border-t border-[#2a2a2a] bg-[#0c0c0c] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-lg">
              <span className="text-[10px] font-mono text-[#555] uppercase font-bold">
                Aggregated Downloads count: <strong className="text-white font-medium">{selectedPaper.downloadsCount || 0}</strong>
              </span>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="flex-1 sm:flex-initial rounded border border-[#222] bg-[#0a0a0a] px-4 py-2 text-xs font-mono font-bold text-[#888] hover:text-white cursor-pointer"
                >
                  Close Abstract
                </button>
                <a
                  href={selectedPaper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleDownloadTrack(selectedPaper)}
                  className="flex-1 sm:flex-initial rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Open / Download PDF
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Share / Broadcast Research Modal Page */}
      {isAddingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-2xl relative space-y-4 text-[#d1d1d1]">
            <button
              onClick={() => setIsAddingPaper(false)}
              className="absolute top-4 right-4 rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-mono text-[#555] hover:text-white hover:border-[#c5a059]/40 cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#c5a059] font-mono tracking-widest uppercase">KNOWLEDGE DISSEMINATION</span>
              <h4 className="font-serif font-light text-white text-base flex items-center gap-1.5">
                <GraduationCap className="h-4.5 w-4.5 text-[#c5a059]" /> Catalog Scholar Publication
              </h4>
              <p className="text-xs text-[#888]">Suggest external peer-reviewed publications, arXiv documents or standard research PDFs to the college ledger.</p>
            </div>

            <form onSubmit={handleCreatePaperSubmit} className="space-y-4 pt-1 font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-8 space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Paper Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. GPT-4 Technical Report"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                    required
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Published Year</label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 2}
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Authors / Investigators (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Ilya Sutskever, Jerry Tworek, Wojciech Zaremba"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Journal / Conference</label>
                  <input
                    type="text"
                    placeholder="e.g. NeurIPS, CVPR, ArXiv, ICLR"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Subject Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Deep Learning, NLP, AI"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Digital Object ID (DOI / optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10.48550/arXiv.2303.08774"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Academic PDF URL (Real PDF address)</label>
                  <input
                    type="url"
                    placeholder="https://example.edu/publications/paper.pdf"
                    value={newPdfUrl}
                    onChange={(e) => setNewPdfUrl(e.target.value)}
                    className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Abstract Summary Description</label>
                <textarea
                  placeholder="Enter the full structured abstract of the scholastic document verbatim..."
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  rows={4}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPaper(false)}
                  className="flex-1 rounded border border-[#222] bg-[#0a0a0a] py-2 text-xs font-mono font-bold text-[#555] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black py-2.5 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent inline-block" />
                      Uploading Document...
                    </>
                  ) : (
                    'Catalog Transcripts'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
