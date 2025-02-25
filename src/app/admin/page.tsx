'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toggleWheelStatus, getWheelStatus } from '@/lib/firebase';

import DishList from '@/components/admin/DishList';
import CategoryForm from '@/components/admin/CategoryForm';
import CategoryList from '@/components/admin/CategoryList';
import DishForm from '@/components/admin/DishForm';
import RoundManager from '@/components/admin/RoundManager';

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isWheelActive, setIsWheelActive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshCategories, setRefreshCategories] = useState(0);
  const [refreshDishes, setRefreshDishes] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchWheelStatus = async () => {
      const status = await getWheelStatus();
      setIsWheelActive(status);
    };
    fetchWheelStatus();
  }, []);

  const handleToggleWheel = async () => {
    setIsUpdating(true);
    try {
      await toggleWheelStatus(!isWheelActive);
      setIsWheelActive(!isWheelActive);
    } catch (error) {
      console.error('Error updating wheel status:', error);
    }
    setIsUpdating(false);
  };

  const handleCategoryAdded = () => {
    setRefreshCategories(prev => prev + 1); // Incrementa el contador para forzar la actualización
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
      {/* Gestión de Rondas */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Gestión de Rondas</h2>
        <RoundManager />
      </div>

      {/* Gestión de Categorías */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Gestión de Categorías</h2>
        <CategoryForm onCategoryAdded={handleCategoryAdded} />
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Categorías Existentes</h3>
          <CategoryList refreshTrigger={refreshCategories} />
        </div>
      </div>

      {/* Gestión de Platillos */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Gestión de Platillos</h2>
        <DishForm
          onDishAdded={() => setRefreshDishes(prev => prev + 1)}
          refreshCategoriesTrigger={refreshCategories}
        />
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Platillos por Categoría</h3>
          <DishList refreshTrigger={refreshDishes} />
        </div>
      </div>
    </div>
  );
}