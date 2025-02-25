'use client';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';

import GameWheel from '@/components/wheel/GameWheel';
import GameCards from '@/components/cards/GameCards';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

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

  return <GameCards />;
}