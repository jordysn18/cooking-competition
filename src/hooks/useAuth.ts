import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import type { User, AuthState } from '@/types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde la base de datos
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        setAuthState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData?.name || '',
            isAdmin: userData?.isAdmin || false,
          },
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Guardar información adicional del usuario
      await set(ref(database, `users/${user.uid}`), {
        name,
        email,
        isAdmin: false,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, error: error.message }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, error: error.message }));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, error: error.message }));
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    logout,
  };
};