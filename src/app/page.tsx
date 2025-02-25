'use client';
import React, { ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';
import GameCards from '@/components/cards/GameCards';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

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

  // Asegurarse de que el componente solo se renderice después de que tengamos
  // información de autenticación completa
  useEffect(() => {
    if (!loading) {
      setIsPageReady(true);
    }
  }, [loading]);

  // Mostrar spinner mientras carga
  if (loading || !isPageReady) {
    return <LoadingSpinner />;
  }

  // Si no hay usuario, mostrar formulario de login
  if (!user) {
    return (
      <div>
        <AuthForm type="login" />
        <div className="text-center mt-4">
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    );
  }

  // Usuario autenticado, mostrar contenido principal
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Bienvenido, {user.name || user.email}
        </h1>
        
        {/* Envolver GameCards en un error boundary */}
        <ErrorBoundary>
          <GameCards />
        </ErrorBoundary>
      </div>
    </div>
  );
}