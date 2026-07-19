import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'customer' | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Automatically make flaymbd@gmail.com an admin
        let userRole: 'admin' | 'customer' = 'customer';
        if (currentUser.email === 'flaymbd@gmail.com') {
          userRole = 'admin';
        }

        try {
          const roleDocRef = doc(db, 'user_roles', currentUser.uid);
          const roleDoc = await getDoc(roleDocRef);
          if (roleDoc.exists()) {
            setRole(roleDoc.data().role);
          } else {
            await setDoc(roleDocRef, { role: userRole });
            setRole(userRole);
          }
        } catch (error) {
          console.error("Error fetching/setting role from db:", error);
          setRole(userRole);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading, 
      loginWithGoogle, 
      loginWithEmail, 
      signUpWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
