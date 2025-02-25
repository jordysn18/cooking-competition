'use client';
import { useState } from 'react';
import { addCategory } from '@/lib/firebase';

interface CategoryFormProps {
  onCategoryAdded?: () => void;
}

export default function CategoryForm({ onCategoryAdded }: CategoryFormProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await addCategory(categoryName.trim());
      setCategoryName('');
      onCategoryAdded?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Categoría
          </label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: Pastas, Mariscos, etc."
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting || !categoryName.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Agregando...' : 'Agregar Categoría'}
          </button>
        </div>
      </div>
    </form>
  );
}