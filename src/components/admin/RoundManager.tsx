'use client';
import { useState, useEffect } from 'react';
import { createNewRound, getRounds, getRegisteredUsers, getCategories, deleteRound } from '@/lib/firebase';
import { getDatabase, ref, update } from 'firebase/database';
import { formatDishName } from '@/utils/format';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Category {
  name: string;
  active: boolean;
}

interface Round {
  date: string;
  categoryId: string;
  status: string;
  participants: {
    [key: string]: {
      name: string;
      email: string;
      dishId?: string;
    };
  };
}

interface RoundWithId extends Round {
  id: string;
}

export default function RoundManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [rounds, setRounds] = useState<{ [key: string]: Round }>({});
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [roundsData, usersData, categoriesData] = await Promise.all([
        getRounds(),
        getRegisteredUsers(),
        getCategories()
      ]);
      setRounds(roundsData);
      setUsers(usersData);
      setCategories(categoriesData);
    };
    fetchData();
  }, []);

  const handleCreateRound = async () => {
    if (!selectedDate || selectedParticipants.length === 0 || !selectedCategory) return;

    setIsCreating(true);
    try {
      const participants = selectedParticipants.reduce((acc, userId) => {
        acc[userId] = {
          name: users[userId].name,
          email: users[userId].email
        };
        return acc;
      }, {} as any);

      await createNewRound(selectedDate, participants, selectedCategory);
      const updatedRounds = await getRounds();
      setRounds(updatedRounds);
      setSelectedDate('');
      setSelectedParticipants([]);
      setSelectedCategory('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta ronda?')) {
      await deleteRound(roundId);
      const updatedRounds = await getRounds();
      setRounds(updatedRounds);
    }
  };

  const handleActivateRound = async (roundId: string) => {
    try {
      const db = getDatabase();
      await update(ref(db, `rounds/${roundId}`), {
        status: 'active'
      });
      alert('Ronda activada exitosamente');
      // Actualizar la lista de rondas
      const updatedRounds = await getRounds();
      setRounds(updatedRounds);
    } catch (error) {
      console.error('Error activating round:', error);
      alert('Error al activar la ronda');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">Crear Nueva Ronda</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de la Ronda
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-gray-900 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Participantes
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
              {Object.entries(users).map(([userId, user]) => (
                <div key={userId} className="flex items-center">
                  <input
                    type="checkbox"
                    id={userId}
                    checked={selectedParticipants.includes(userId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants([...selectedParticipants, userId]);
                      } else {
                        setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor={userId} className="ml-2 text-sm text-gray-700">
                    {formatDishName(user.name)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de la Ronda
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900"
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

          <button
            onClick={handleCreateRound}
            disabled={isCreating || !selectedDate || selectedParticipants.length === 0 || !selectedCategory}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isCreating ? 'Creando...' : 'Crear Ronda'}
          </button>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">Rondas Existentes</h3>
        <div className="space-y-4">
          {Object.entries(rounds).map(([id, round]) => (
            <div key={id} className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Fecha: {new Date(round.date + 'T00:00:00').toLocaleDateString()}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-sm ${round.status === 'completed' ? 'bg-green-100 text-green-800' :
                        round.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {round.status}
                    </span>
                    {round.status === 'pending' && (
                      <button
                        onClick={() => handleActivateRound(id)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Activar Ronda
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRound(id)}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-blue-600">
                    Categoría: {categories[round.categoryId]?.name || 'Sin categoría'}
                  </span>
                </div>
                {round.participants && (
                  <div>
                    <p className="text-sm text-gray-600 mt-2">Participantes:</p>
                    <div className="mt-1 space-y-1">
                      {Object.entries(round.participants).map(([userId, participant]) => (
                        <div key={userId} className="flex items-center text-sm">
                          <span className="font-medium">{formatDishName(participant.name)}</span>
                          {participant.dishId && (
                            <>
                              <span className="mx-2">→</span>
                              <span>{formatDishName(participant.dishId)}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {Object.keys(rounds).length === 0 && (
            <p className="text-gray-500">No hay rondas creadas</p>
          )}
        </div>
      </div>
    </div>
  );
}