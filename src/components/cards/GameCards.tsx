'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDatabase, ref, onValue, get, update } from 'firebase/database';
import { moveToNextTurn } from '@/lib/firebase';
import { formatDishName } from '@/utils/format';

import RoundEvaluation from '@/components/evaluation/RoundEvaluation';
import RoundResults from '@/components/results/RoundResults';

interface Dish {
  id: string;
  name: string;
  categoryId: string;
  difficulty: string;
  active: boolean;
}

interface RoundParticipant {
  name: string;
  dishId?: string;
}

interface Round {
  date: string;
  categoryId: string;
  status: string;
  currentTurn: string;
  turnOrder: string[];
  dishOrder?: string[];
  evaluationStatus?: 'pending' | 'completed';
  currentReveal?: {
    dishId: string;
    timestamp: number;
  };
  participants: {
    [key: string]: RoundParticipant;
  };
  evaluations?: {
    [key: string]: {
      [key: string]: {
        presentation: number;
        taste: number;
        comments?: string;
        evaluatedBy: string;
      }
    }
  };
}

interface RoundWithId extends Round {
  id: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function GameCards() {
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState<RoundWithId | null>(null);
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [shuffledDishes, setShuffledDishes] = useState<Dish[]>([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allEvaluationsComplete, setAllEvaluationsComplete] = useState(false);

  const allParticipantsHaveDish = () => {
    if (!currentRound) return false;
    return Object.values(currentRound.participants).every(participant => participant.dishId);
  };

  useEffect(() => {
    const db = getDatabase();
    const roundsRef = ref(db, 'rounds');

    const unsubscribe = onValue(roundsRef, async (snapshot) => {
      const rounds = snapshot.val() as { [key: string]: Round } | null;
      if (!rounds) return;

      const activeRound = Object.entries(rounds).find(([_, round]) =>
        round.status === 'active' &&
        round.participants &&
        Object.keys(round.participants).includes(user?.id || '')
      );

      if (activeRound) {
        const [roundId, roundData] = activeRound;
        setCurrentRound({ ...roundData, id: roundId });

        // Configuración inicial de turnos si es necesario
        if (!roundData.currentTurn || !roundData.turnOrder) {
          const participantIds = Object.keys(roundData.participants);
          await update(ref(db, `rounds/${roundId}`), {
            currentTurn: participantIds[0],
            turnOrder: participantIds
          });
        }

        // Si ya hay evaluaciones y el usuario ya evaluó, mostrar la pantalla de evaluaciones
        if (roundData.evaluations && roundData.evaluations[user?.id || '']) {
          setShowEvaluation(true);
          setShowResults(false);
        }

        // Verificar si todas las evaluaciones están completas
        const totalParticipants = Object.keys(roundData.participants).length;
        const completedEvaluations = roundData.evaluations ? Object.keys(roundData.evaluations).length : 0;

        if (completedEvaluations === totalParticipants) {
          setShowEvaluation(false);
          setShowResults(true);
          setAllEvaluationsComplete(true);

          // Actualizar estado de la ronda si es necesario
          if (roundData.status !== 'completed') {
            await update(ref(db, `rounds/${roundId}`), {
              status: 'completed'
            });
          }
        }

        // Cargar y procesar platos
        const dishesRef = ref(db, 'dishes');
        const dishesSnapshot = await get(dishesRef);
        const dishes = dishesSnapshot.val() as { [key: string]: Dish } | null;

        if (dishes) {
          const categoryDishes = Object.entries(dishes)
            .filter(([id, dish]) =>
              dish.categoryId === roundData.categoryId &&
              dish.active &&
              !Object.values(roundData.participants).some((p: RoundParticipant) => p.dishId === id)
            )
            .map(([id, dishData]) => ({
              ...dishData,
              id
            }));

          setAvailableDishes(categoryDishes);

          if (!roundData.dishOrder) {
            const shuffledIds = shuffleArray(categoryDishes).map(dish => dish.id);
            await update(ref(db, `rounds/${roundId}`), {
              dishOrder: shuffledIds
            });
            setShuffledDishes(categoryDishes.sort((a, b) =>
              shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id)
            ));
          } else {
            setShuffledDishes(categoryDishes.sort((a, b) =>
              roundData.dishOrder!.indexOf(a.id) - roundData.dishOrder!.indexOf(b.id)
            ));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const isUserTurn = (round: RoundWithId, userId: string) => {
    return round.currentTurn === userId;
  };

  const handleStartEvaluation = async () => {
    if (!currentRound || !user?.id) return;

    try {
      const db = getDatabase();
      await update(ref(db, `rounds/${currentRound.id}`), {
        evaluationStatus: 'pending'
      });
      setShowEvaluation(true); // Forzamos mostrar la evaluación inmediatamente
    } catch (error) {
      console.error('Error starting evaluation:', error);
    }
  };

  if (!currentRound || !user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">No hay una ronda activa en este momento.</p>
      </div>
    );
  }

  const participantData = currentRound.participants[user.id];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Ronda del {new Date(currentRound.date + 'T00:00:00').toLocaleDateString()}
        </h2>
        <p className="text-lg text-gray-600">
          Participante: {formatDishName(participantData.name)}
        </p>
        {!allParticipantsHaveDish() && currentRound.currentTurn && currentRound.participants[currentRound.currentTurn] && (
          <p className="text-md text-blue-600 mt-2">
            ¡Es el turno de: {formatDishName(currentRound.participants[currentRound.currentTurn].name)}!
          </p>
        )}
      </div>

      {!showEvaluation && !showResults && (
        <>
          {!allParticipantsHaveDish() && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {shuffledDishes.map((dish) => {
                const isRevealed = dish.id === currentRound.currentReveal?.dishId ||
                  Object.values(currentRound.participants)
                    .some(p => p.dishId === dish.id);

                return (
                  <div
                    key={dish.id}
                    className="card-container aspect-[3/4]"
                  >
                    <div
                      className={`card w-full h-full cursor-pointer ${isRevealed ? 'flipped' : ''}`}
                      onClick={async () => {
                        if (!isRevealed && isUserTurn(currentRound, user?.id || '') && !participantData.dishId) {
                          const db = getDatabase();

                          await update(ref(db, `rounds/${currentRound.id}`), {
                            currentReveal: {
                              dishId: dish.id,
                              timestamp: Date.now()
                            }
                          });

                          setTimeout(async () => {
                            try {
                              await update(ref(db, `rounds/${currentRound.id}`), {
                                [`participants/${user.id}/dishId`]: dish.id,
                                currentReveal: null
                              });

                              await moveToNextTurn(currentRound.id, user.id, currentRound.turnOrder);
                            } catch (error) {
                              console.error('Error saving result:', error);
                            }
                          }, 3000);
                        }
                      }}
                    >
                      <div className="card-front bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center">
                        <span className="text-white text-4xl">?</span>
                      </div>

                      <div className="card-back bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
                        <span className="text-lg font-medium text-center">
                          {formatDishName(dish.name)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {allParticipantsHaveDish() && !showEvaluation && (
            <div className="text-center mb-8">
              <button
                onClick={handleStartEvaluation}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ¡Calificar Platillos!
              </button>
            </div>
          )}
        </>
      )}

      {showEvaluation && currentRound && !allEvaluationsComplete && (
        <RoundEvaluation
          roundId={currentRound.id}
          onEvaluationComplete={() => {
            // No necesitamos hacer nada aquí, el listener se encargará
          }}
        />
      )}

      {showResults && currentRound && allEvaluationsComplete && (
        <RoundResults roundId={currentRound.id} />
      )}

      {!allParticipantsHaveDish() && !showEvaluation && !showResults && (
        <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Platillos Disponibles:</h3>
          <div className="space-y-2">
            {availableDishes.map((dish, index) => (
              <div key={dish.id} className="flex items-center space-x-3">
                <span className="text-lg">
                  {index + 1}. {formatDishName(dish.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Resultados:</h3>
        <div className="space-y-2">
          {Object.entries(currentRound.participants).map(([id, participant]) => (
            <div key={id} className="flex justify-between items-center">
              <span className="font-medium">{formatDishName(participant.name)}</span>
              <span className="text-gray-600">
                {participant.dishId ?
                  formatDishName(availableDishes.find(d => d.id === participant.dishId)?.name || participant.dishId)
                  : 'Pendiente'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}