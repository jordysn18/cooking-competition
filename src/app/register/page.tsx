'use client';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Register() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si el usuario está autenticado, mostramos una página en blanco mientras se redirecciona
  if (user) {
    return null;
  }

  return (
    <div>
      <AuthForm type="register" />
      <div className="text-center mt-4">
        <Link href="/" className="text-indigo-600 hover:text-indigo-500">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </div>
  );
}