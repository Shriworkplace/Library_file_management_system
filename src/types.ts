export interface UserProfile {
  uid: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'librarian' | 'admin';
  studentId?: string;
  librarianId?: string;
  department?: string;
  semester?: number;
  status: 'pending_approval' | 'active' | 'graduated' | 'suspended';
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  bookId: string;
  isbn: string;
  title: string;
  author: string[];
  publisher: string;
  publicationYear: number;
  description: string;
  genre: string[];
  subjectTags: string[];
  coverImageUrl: string;
  totalCopies: number;
  availableCopies: number;
  averageRating: number;
  ratingCount: number;
  circulationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookCopy {
  copyId: string;
  bookId: string;
  barcode: string;
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  status: 'available' | 'issued' | 'reserved' | 'damaged' | 'lost';
  currentIssueId: string | null;
}

export interface Issue {
  issueId: string;
  studentId: string;
  bookId: string;
  copyId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  fineAmount: number;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  approvedBy?: string;
}

export interface IssueRequest {
  requestId: string;
  studentId: string;
  bookId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  requestDate: string;
  rejectionReason?: string;
}

export interface Reservation {
  reservationId: string;
  studentId: string;
  bookId: string;
  reservationDate: string;
  holdUntilDate: string;
  position: number;
  status: 'active' | 'notified' | 'issued' | 'expired' | 'cancelled';
}

export interface Review {
  userId: string;
  bookId: string;
  rating: number;
  reviewText: string;
  isAnonymous: boolean;
  userName: string;
  createdAt: string;
}

export interface ReadingListBook {
  bookId: string;
  status: 'want_to_read' | 'reading' | 'read';
  addedDate: string;
  readDate: string | null;
}

export interface ReadingList {
  listId: string;
  studentId: string;
  name: string;
  description: string;
  isPublic: boolean;
  books: ReadingListBook[];
}

export interface Milestone {
  milestoneId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedHours: number;
  order: number;
  resources: string[]; // references of Resource ids
  assessment?: {
    type: 'quiz' | 'project' | 'none';
    link: string;
  };
}

export interface RoadmapStage {
  stageName: 'Beginner' | 'Intermediate' | 'Advanced';
  milestones: Milestone[];
}

export interface SkillRoadmap {
  skillId: string;
  name: string;
  skillName: string;
  description: string;
  estimatedHours: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  stages: RoadmapStage[];
  isActive: boolean;
}

export interface MilestoneProgress {
  milestoneId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  hoursLogged: number;
  startedDate: string | null;
  completedDate: string | null;
}

export interface StudentRoadmapProgress {
  progressId: string;
  studentId: string;
  roadmapId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startDate: string;
  targetCompletionDate: string | null;
  completionDate: string | null;
  pace: 'slow' | 'medium' | 'fast';
  milestoneProgress: MilestoneProgress[];
  totalHoursLogged: number;
  progressPercentage: number;
}

export interface Resource {
  resourceId: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'documentation' | 'practice' | 'project';
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  provider: string;
  isPaid: boolean;
  rating: number;
  upvoteCount: number;
  downvoteCount: number;
  isCurated: boolean;
}

export interface Fine {
  fineId: string;
  studentId: string;
  issueId: string | null;
  amount: number; // in Rupees
  reason: 'overdue' | 'damage' | 'loss' | 'other';
  status: 'due' | 'paid' | 'waived';
  createdAt: string;
}

export interface ResearchPaper {
  paperId: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedYear: number;
  journal: string;
  doi?: string;
  pdfUrl: string;
  subjectTags: string[];
  downloadsCount: number;
  addedBy: string;
  createdAt: string;
}

