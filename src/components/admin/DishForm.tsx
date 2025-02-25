'use client';
import { useState, useEffect } from 'react';
import { addDish, getCategories } from '@/lib/firebase';

type Difficulty = 'fácil' | 'medio' | 'difícil';

interface Category {
  name: string;
  active: boolean;
}

interface CategoryMap {
  [key: string]: Category;
}

interface DishFormProps {
  onDishAdded?: () => void;
  refreshCategoriesTrigger?: number;
}

interface DishFormData {
  name: string;
  categoryId: string;
  description: string;
  difficulty: Difficulty;
  active: boolean;
}

export default function DishForm({ onDishAdded, refreshCategoriesTrigger }: DishFormProps) {
  const [categories, setCategories] = useState<CategoryMap>({});
  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    categoryId: '',
    description: '',
    difficulty: 'medio',
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    };
    loadCategories();
  }, [refreshCategoriesTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) return;

    setIsSubmitting(true);
    try {
      await addDish(formData);
      setFormData({
        name: '',
        categoryId: '',
        description: '',
        difficulty: 'medio',
        active: true
      });
      onDishAdded?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDifficultyChange = (value: string) => {
    if (value === 'fácil' || value === 'medio' || value === 'difícil') {
      setFormData(prev => ({ ...prev, difficulty: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre del Platillo
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Ej: Lasaña, Paella, etc."
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoría
        </label>
        <select
          id="category"
          value={formData.categoryId}
          onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isSubmitting}
          required
        >
          <option value="">Selecciona una categoría</option>
          {Object.entries(categories).map(([id, category]) => (
            <option key={id} value={id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
          Dificultad
        </label>
        <select
          id="difficulty"
          value={formData.difficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isSubmitting}
        >
          <option value="fácil">Fácil</option>
          <option value="medio">Medio</option>
          <option value="difícil">Difícil</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          disabled={isSubmitting}
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
          Platillo activo
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim() || !formData.categoryId}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Agregando...' : 'Agregar Platillo'}
        </button>
      </div>
    </form>
  );
}