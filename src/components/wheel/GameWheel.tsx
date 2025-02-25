'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDatabase, ref, onValue, get, update } from 'firebase/database';
import { moveToNextTurn } from '@/lib/firebase';
import { formatDishName } from '@/utils/format';

const WHEEL_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-orange-500'
];

interface DishData {
  name: string;
  categoryId: string;
  difficulty: string;
  active: boolean;
}

interface Dish extends DishData {
  id: string;
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
  participants: {
    [key: string]: RoundParticipant;
  };
}

interface RoundWithId extends Round {
  id: string;
}

export default function GameWheel() {
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState<RoundWithId | null>(null);
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedDish, setSelectedDish] = useState<string | null>(null);

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

        if (!roundData.currentTurn || !roundData.turnOrder) {
          const participantIds = Object.keys(roundData.participants);
          const updatedRound = {
            ...roundData,
            currentTurn: roundData.currentTurn || participantIds[0],
            turnOrder: roundData.turnOrder || participantIds
          };

          await update(ref(db, `rounds/${roundId}`), {
            currentTurn: updatedRound.currentTurn,
            turnOrder: updatedRound.turnOrder
          });

          setCurrentRound({ ...updatedRound, id: roundId });
        } else {
          setCurrentRound({ ...roundData, id: roundId });
        }

        const dishesRef = ref(db, 'dishes');
        const dishesSnapshot = await get(dishesRef);
        const dishes = dishesSnapshot.val() as { [key: string]: DishData } | null;

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
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const isUserTurn = (round: RoundWithId, userId: string) => {
    return round.currentTurn === userId;
  };

  const handleSpin = async () => {
    if (!currentRound || !user?.id || isSpinning || !isUserTurn(currentRound, user.id)) return;

    setIsSpinning(true);
    const spins = 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = spins * 360 + extraDegrees;

    const wheel = document.querySelector('.wheel-container') as HTMLDivElement;
    if (wheel) {
      wheel.style.transform = `rotate(${totalRotation}deg)`;

      setTimeout(async () => {
        const finalRotation = totalRotation % 360;
        const sliceSize = 360 / availableDishes.length;
        const selectedIndex = Math.floor(finalRotation / sliceSize);
        const selectedDish = availableDishes[selectedIndex];

        try {
          const db = getDatabase();
          await update(ref(db, `rounds/${currentRound.id}/participants/${user.id}`), {
            dishId: selectedDish.id
          });

          await moveToNextTurn(currentRound.id, user.id, currentRound.turnOrder);
          setSelectedDish(selectedDish.id);
        } catch (error) {
          console.error('Error saving result:', error);
        }

        setIsSpinning(false);
      }, 3000);
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
          Participante: {participantData.name}
        </p>
        {currentRound.currentTurn && currentRound.participants[currentRound.currentTurn] && (
          <p className="text-md text-blue-600 mt-2">
            Turno actual: {currentRound.participants[currentRound.currentTurn].name}
          </p>
        )}
      </div>

      {/* Contenedor principal que incluye ruleta y leyenda */}
      <div>
        {/* Contenedor de la ruleta */}
        <div className="relative w-96 h-96 mx-auto mb-8">
          <div
            className="wheel-container absolute inset-0 rounded-full overflow-hidden border-4 border-gray-200"
            style={{
              transform: 'rotate(0deg)',
              transformOrigin: 'center',
              backgroundColor: 'white'
            }}
          >
            {availableDishes.map((dish, index) => {
              const angle = 360 / availableDishes.length;
              const skewAngle = 90 - angle;
              const color = WHEEL_COLORS[index % WHEEL_COLORS.length];

              return (
                <div
                  key={dish.id}
                  className="absolute top-0 right-0 w-[50%] h-[50%] origin-top-left -translate-y-1/2"
                  style={{
                    transform: `
                      rotate(${angle * index}deg)
                      skew(${skewAngle}deg)
                      scale(2.31)
                    `
                  }}
                >
                  <div className={`w-full h-full ${color}`}>
                    <span
                      className="absolute text-white font-bold text-2xl"
                      style={{
                        left: '30%',
                        top: '30%',
                        transform: `
                          rotate(${-angle * index - skewAngle / 2}deg)
                          skew(${-skewAngle}deg)
                        `
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón central */}
          <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full shadow-lg z-20 flex items-center justify-center">
            <button
              onClick={handleSpin}
              disabled={!isUserTurn(currentRound, user.id) || isSpinning || Boolean(participantData.dishId)}
              className="w-full h-full rounded-full flex items-center justify-center focus:outline-none transform hover:scale-105 transition-transform disabled:opacity-50"
            >
              <span className="font-bold text-gray-800 text-xl">SPIN</span>
            </button>
          </div>

          {/* Flecha indicadora */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-red-600 transform rotate-45"></div>
          </div>
        </div>

        {/* Leyenda de platillos */}
        <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Platillos Disponibles:</h3>
          <div className="space-y-2">
            {availableDishes.map((dish, index) => {
              const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
              return (
                <div key={dish.id} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 ${color} rounded`}></div>
                  <span className="text-lg">
                    {index + 1}. {formatDishName(dish.name)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resultados en tiempo real */}
      <div className="mt-8 p-4 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Resultados:</h3>
        <div className="space-y-2">
          {Object.entries(currentRound.participants).map(([id, participant]) => (
            <div key={id} className="flex justify-between items-center">
              <span className="font-medium">{participant.name}</span>
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

      {/* Botón para girar */}
      <div className="text-center mt-8">
        <button
          onClick={handleSpin}
          disabled={!isUserTurn(currentRound, user.id) || isSpinning || Boolean(participantData.dishId)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isSpinning ? 'Girando...' :
            participantData.dishId ? 'Platillo asignado' :
              isUserTurn(currentRound, user.id) ? 'Girar Ruleta' :
                `Turno de ${currentRound.participants[currentRound.currentTurn]?.name || 'otro participante'}`}
        </button>
      </div>
    </div>
  );
}