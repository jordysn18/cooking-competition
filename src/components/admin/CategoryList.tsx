'use client';
import { useEffect, useState } from 'react';
import { getCategories, deleteCategory } from '@/lib/firebase';

interface Category {
  name: string;
  createdAt: string;
  active: boolean;
}

interface CategoryMap {
  [key: string]: Category;
}

interface CategoryListProps {
  refreshTrigger: number;
}

export default function CategoryList({ refreshTrigger }: CategoryListProps) {
  const [categories, setCategories] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]); // Se ejecutará cuando refreshTrigger cambie

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      await deleteCategory(categoryId);
      fetchCategories();
    }
  };

  if (isLoading) {
    return <div>Cargando categorías...</div>;
  }

  if (Object.keys(categories).length === 0) {
    return <div className="text-gray-500">No hay categorías registradas</div>;
  }

  return (
    <div className="grid gap-4">
      {Object.entries(categories).map(([id, category]) => (
        <div
          key={id}
          className="flex justify-between items-center p-3 bg-white rounded-lg border"
        >
          <span className="font-medium">{category.name}</span>
          <button
            onClick={() => handleDelete(id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}