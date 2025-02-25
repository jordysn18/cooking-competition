'use client';
import { useAuth } from '@/hooks/useAuth';
import RoundHistoryList from '@/components/history/RoundHistoryList';

export default function HistoryPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Debes iniciar sesión para ver el historial.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Historial de Rondas</h1>
      <RoundHistoryList />
    </div>
  );
}