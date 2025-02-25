'use client';
import React, { ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';
import GameCards from '@/components/cards/GameCards';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getDatabase, ref, get } from 'firebase/database';

// Definir las propiedades y el estado del ErrorBoundary
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Componente con tipos correctos
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Puedes registrar el error en un servicio de reporte
    console.error("Error en componente:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Ha ocurrido un error
          </h2>
          <p className="mb-4">
            No se pudo cargar el componente. Por favor, intenta recargar la página.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  const { user, loading } = useAuth();
  const [isPageReady, setIsPageReady] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      // Si tenemos el nombre, usarlo directamente
      if (user.name) {
        setUserName(user.name);
      } 
      // Si no tenemos nombre, intentar obtenerlo de la base de datos
      else {
        const fetchUserName = async () => {
          try {
            const db = getDatabase();
            const userRef = ref(db, `users/${user.id}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (userData?.name) {
              setUserName(userData.name);
            } else {
              setUserName(user.email || '');
            }
          } catch (error) {
            console.error("Error fetching user name:", error);
            setUserName(user.email || '');
          }
        };
        
        fetchUserName();
      }
    }
    
    if (!loading) {
      setIsPageReady(true);
    }
  }, [user, loading]);

  // Mostrar spinner mientras carga
  if (loading || !isPageReady) {
    return <LoadingSpinner />;
  }

  // Si no hay usuario, mostrar formulario de login
  if (!user) {
    return (
      <div>
        <AuthForm type="login" />
      </div>
    );
  }

  // Usuario autenticado, mostrar contenido principal
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Bienvenido, {userName || user.email || ''}
        </h1>
        
        {/* Envolver GameCards en un error boundary */}
        <ErrorBoundary>
          <GameCards />
        </ErrorBoundary>
      </div>
    </div>
  );
}