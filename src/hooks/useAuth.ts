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

  // Función para cargar los datos de usuario desde la base de datos
  const loadUserData = async (uid: string) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.val();
    } catch (error) {
      console.error("Error cargando datos de usuario:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde la base de datos
        const userData = await loadUserData(firebaseUser.uid);

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
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Guardar información adicional del usuario
      await set(ref(database, `users/${user.uid}`), {
        name,
        email,
        isAdmin: false,
      });

      // Actualizar inmediatamente el estado con los nuevos datos
      setAuthState({
        user: {
          id: user.uid,
          email: user.email || '',
          name: name,
          isAdmin: false,
        },
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Cargar datos de usuario después de iniciar sesión
      const userData = await loadUserData(user.uid);
      
      setAuthState({
        user: {
          id: user.uid,
          email: user.email || '',
          name: userData?.name || '',
          isAdmin: userData?.isAdmin || false,
        },
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await signOut(auth);
      setAuthState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    logout,
  };
};