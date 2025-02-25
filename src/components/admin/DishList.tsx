'use client';
import { useEffect, useState } from 'react';
import { getDishes, getCategories, deleteCategory } from '@/lib/firebase';

interface Dish {
  id?: string;
  name: string;
  categoryId: string;
  description?: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  active: boolean;
  createdAt: string;
}

type DishWithId = Dish & { id: string };

interface Category {
  name: string;
  active: boolean;
}

interface DishListProps {
  refreshTrigger: number;
}

const getCategoryColor = (categoryId: string) => {
  const colors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-red-100',
    'bg-orange-100'
  ];

  // Usar una función hash simple para el id
  const hash = categoryId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

export default function DishList({ refreshTrigger }: DishListProps) {
  const [dishes, setDishes] = useState<{ [key: string]: Dish }>({});
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [dishesData, categoriesData] = await Promise.all([
        getDishes(),
        getCategories()
      ]);
      setDishes(dishesData);
      setCategories(categoriesData);
      setIsLoading(false);
    };
    fetchData();
  }, [refreshTrigger]);

  if (isLoading) {
    return <div>Cargando platillos...</div>;
  }

  // Agrupar platillos por categoría
  const dishesByCategory: { [key: string]: DishWithId[] } = {};
  Object.entries(dishes).forEach(([id, dish]) => {
    if (!dishesByCategory[dish.categoryId]) {
      dishesByCategory[dish.categoryId] = [];
    }
    dishesByCategory[dish.categoryId].push({ ...dish, id });
  });

  if (Object.keys(dishes).length === 0) {
    return <div className="text-gray-500">No hay platillos registrados</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([categoryId, category]) => {
        const categoryDishes = dishesByCategory[categoryId] || [];
        const colorClass = getCategoryColor(categoryId);

        return (
          <div
            key={categoryId}
            className={`p-4 rounded-lg ${colorClass}`}
          >
            <h3 className="text-lg font-semibold mb-3">{category.name}</h3>
            <div className="grid gap-3">
              {categoryDishes.map((dish: DishWithId) => (
                <div
                  key={dish.id}
                  className="bg-white p-3 rounded-md shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{dish.name}</h4>
                      {dish.description && (
                        <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
                      )}
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${dish.difficulty === 'fácil' ? 'bg-green-100 text-green-800' :
                            dish.difficulty === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {dish.difficulty}
                        </span>
                        {!dish.active && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {categoryDishes.length === 0 && (
                <p className="text-sm text-gray-500">No hay platillos en esta categoría</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}