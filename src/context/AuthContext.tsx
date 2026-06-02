import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile } from '../types';
import { seedDatabaseIfEmpty } from '../seed';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setProfileRole: (role: 'student' | 'librarian' | 'admin') => Promise<void>;
  simulateLoginAs: (role: 'student' | 'librarian' | 'admin', name: string) => Promise<void>;
  loginWithEmailAndPassword: (email: string, password: string, role: 'student' | 'librarian') => Promise<UserProfile>;
  registerWithEmailAndPassword: (params: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'librarian';
    department?: string;
    semester?: number;
    status?: 'active' | 'pending_approval' | 'graduated' | 'suspended';
  }) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Seed on mount if database is empty
  useEffect(() => {
    seedDatabaseIfEmpty();
  }, []);

  const syncProfile = async (firebaseUser: User, overrideRole?: 'student' | 'librarian' | 'admin', overrideName?: string) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserProfile;
      if (overrideRole) {
        const updated: UserProfile = {
          ...existingData,
          role: overrideRole,
          firstName: overrideName ? overrideName.split(' ')[0] : existingData.firstName,
          lastName: overrideName ? overrideName.split(' ')[1] || '' : existingData.lastName,
          updatedAt: new Date().toISOString()
        };
        
        if (overrideRole === 'student') {
          if (!updated.studentId) {
            updated.studentId = existingData.studentId || `STU-${Math.floor(100000 + Math.random() * 900000)}`;
          }
        } else {
          delete updated.studentId;
        }

        await setDoc(userRef, updated);
        setProfile(updated);
      } else {
        setProfile(existingData);
      }
    } else {
      // Create new profile
      const [first, ...lastParts] = (overrideName || firebaseUser.displayName || "Global Student").split(" ");
      const assignedRole = overrideRole || 'student';
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: first || 'Global',
        lastName: lastParts.join(' ') || 'User',
        role: assignedRole,
        status: 'active',
        department: 'Computer Science',
        semester: 4,
        interests: ['Python', 'Web Development', 'Machine Learning'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (assignedRole === 'student') {
        newProfile.studentId = `STU-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    let active = true;
    let unsubOfAuth: (() => void) | null = null;
    
    const checkSessionAndAuth = async () => {
      const savedSession = localStorage.getItem('college_id_session');
      if (savedSession) {
        try {
          const cached = JSON.parse(savedSession);
          const userRef = doc(db, 'users', cached.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists() && active) {
            const data = docSnap.data() as UserProfile;
            const mockUser = {
              uid: data.uid,
              email: data.email,
              displayName: `${data.firstName} ${data.lastName}`,
              emailVerified: true
            } as any;
            setUser(mockUser);
            setProfile(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Session restore failed", err);
        }
      }
      
      unsubOfAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (localStorage.getItem('college_id_session')) return;
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            if (active) await syncProfile(firebaseUser);
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.error("Error signing in user", err);
        } finally {
          if (active) setLoading(false);
        }
      });
    };

    checkSessionAndAuth();

    return () => {
      active = false;
      if (unsubOfAuth) {
        unsubOfAuth();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('college_id_session');
      const credentials = await signInWithPopup(auth, googleProvider);
      if (credentials.user) {
        await syncProfile(credentials.user);
      }
    } catch (error) {
      console.error("Google authentication failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('college_id_session');
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const setProfileRole = async (role: 'student' | 'librarian' | 'admin') => {
    if (!user) return;
    await syncProfile(user, role);
  };

  const simulateLoginAs = async (role: 'student' | 'librarian' | 'admin', name: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('college_id_session');
      const mockUid = `demo-${role}-uid`;
      const email = `${role}@dbatu.ac.in`;
      const mockUser = {
        uid: mockUid,
        email: email,
        displayName: name,
        emailVerified: true
      } as any;

      setUser(mockUser);
      await syncProfile(mockUser, role, name);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailAndPassword = async (email: string, password: string, role: 'student' | 'librarian') => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.endsWith('@dbatu.ac.in')) {
        throw new Error("Access Denied: Only email addresses with the '@dbatu.ac.in' domain are allowed.");
      }

      const q = query(collection(db, 'users'), where('email', '==', trimmedEmail));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const matchedDoc = querySnap.docs[0];
        const data = matchedDoc.data() as UserProfile;
        
        if (data.role !== role) {
          throw new Error(`The Email is associated with the role "${data.role}", but you selected "${role}".`);
        }
        
        const storedPassword = data.password || 'password123'; // Default to password123 for existing seeded accounts
        if (password !== storedPassword) {
          throw new Error("Incorrect password. Please try again (default password for testing accounts is 'password123').");
        }
        
        const mockUser = {
          uid: data.uid,
          email: data.email,
          displayName: `${data.firstName} ${data.lastName}`,
          emailVerified: true
        } as any;
        
        setUser(mockUser);
        setProfile(data);
        localStorage.setItem('college_id_session', JSON.stringify({ uid: data.uid, role }));
        return data;
      } else {
        // Dynamic seed fallback mapping: if someone tries to log in with a default email, auto-register them
        if (trimmedEmail === 'arjun@dbatu.ac.in' && role === 'student') {
          return await registerWithEmailAndPassword({
            firstName: 'Arjun',
            lastName: 'Sharma',
            email: 'arjun@dbatu.ac.in',
            password,
            role: 'student',
            department: 'Computer Science',
            semester: 4,
            status: 'pending_approval'
          });
        } else if (trimmedEmail === 'priya@dbatu.ac.in' && role === 'student') {
          return await registerWithEmailAndPassword({
            firstName: 'Priya',
            lastName: 'Nair',
            email: 'priya@dbatu.ac.in',
            password,
            role: 'student',
            department: 'Information Technology',
            semester: 6,
            status: 'active'
          });
        } else if (trimmedEmail === 'sarah@dbatu.ac.in' && role === 'librarian') {
          return await registerWithEmailAndPassword({
            firstName: 'Sarah',
            lastName: 'Jenkins',
            email: 'sarah@dbatu.ac.in',
            password,
            role: 'librarian',
            status: 'active'
          });
        } else if (trimmedEmail === 'robert@dbatu.ac.in' && role === 'librarian') {
          return await registerWithEmailAndPassword({
            firstName: 'Robert',
            lastName: 'Mercer',
            email: 'robert@dbatu.ac.in',
            password,
            role: 'librarian',
            status: 'active'
          });
        }
        
        throw new Error(`Email "${email}" is not registered. Please sign up to create an account.`);
      }
    } catch (err) {
      console.error("Email login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailAndPassword = async (params: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'librarian';
    department?: string;
    semester?: number;
    status?: 'active' | 'pending_approval' | 'graduated' | 'suspended';
  }) => {
    setLoading(true);
    try {
      const formattedEmail = params.email.trim().toLowerCase();
      if (!formattedEmail.endsWith('@dbatu.ac.in')) {
        throw new Error("Registration Denied: You must use an email ending in '@dbatu.ac.in' to sign up.");
      }

      if (params.role === 'librarian' && params.status !== 'active') {
        throw new Error("Registration Blocked: Librarian operations require authorized system administration provisioning.");
      }

      const qCheck = query(collection(db, 'users'), where('email', '==', formattedEmail));
      const snapCheck = await getDocs(qCheck);
      if (!snapCheck.empty) {
        throw new Error(`Email "${params.email}" is already registered. Please log in instead.`);
      }

      // Generate a clean college ID for backward compatibility with barcode / ID displays
      const generatedIdNumber = Math.floor(100000 + Math.random() * 900000);
      const studentId = params.role === 'student' ? `STU-${generatedIdNumber}` : undefined;
      const librarianId = params.role === 'librarian' ? `LIB-${generatedIdNumber}` : undefined;

      const randomUid = `college-user-${formattedEmail.replace(/[^a-z0-9]/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const userRef = doc(db, 'users', randomUid);

      const newProfile: UserProfile = {
        uid: randomUid,
        email: formattedEmail,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
        role: params.role,
        status: params.status || (params.role === 'student' ? 'pending_approval' : 'active'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (params.role === 'student') {
        newProfile.studentId = studentId;
        newProfile.department = params.department || 'Computer Science';
        newProfile.semester = params.semester || 1;
        newProfile.interests = [];
      } else {
        newProfile.librarianId = librarianId;
      }

      await setDoc(userRef, newProfile);
      
      const mockUser = {
        uid: randomUid,
        email: newProfile.email,
        displayName: `${newProfile.firstName} ${newProfile.lastName}`,
        emailVerified: true
      } as any;

      setUser(mockUser);
      setProfile(newProfile);
      localStorage.setItem('college_id_session', JSON.stringify({ uid: randomUid, role: params.role }));

      return newProfile;
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginWithGoogle,
      logout,
      setProfileRole,
      simulateLoginAs,
      loginWithEmailAndPassword,
      registerWithEmailAndPassword,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
