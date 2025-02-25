'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { formatDishName } from '@/utils/format';

interface RoundEvaluationProps {
  roundId: string;
  onEvaluationComplete?: () => void;
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
  evaluationStatus?: 'pending' | 'completed';
  participants: {
    [key: string]: RoundParticipant;
  };
}

interface Evaluation {
  presentation: number;
  taste: number;
  comments?: string;
  evaluatedBy: string;
}

interface DishEvaluation {
  [participantId: string]: Evaluation;
}

interface RoundEvaluation {
  [evaluatorId: string]: DishEvaluation;
}

interface RoundWithEvaluations extends Round {
  evaluations?: RoundEvaluation;
}

const RatingScale = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => onChange(rating)}
          className={`w-10 h-10 rounded-full ${value === rating ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
        >
          {rating}
        </button>
      ))}
    </div>
  );
};

export default function RoundEvaluation({ roundId, onEvaluationComplete }: RoundEvaluationProps) {
  const { user } = useAuth();
  const [round, setRound] = useState<RoundWithEvaluations | null>(null);
  const [evaluations, setEvaluations] = useState<{ [key: string]: Evaluation }>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const roundRef = ref(db, `rounds/${roundId}`);

    const unsubscribe = onValue(roundRef, (snapshot) => {
      const roundData = snapshot.val() as RoundWithEvaluations;
      if (roundData) {
        setRound(roundData);
        // Verificar si el usuario ya ha enviado evaluaciones
        if (roundData.evaluations?.[user?.id || '']) {
          setHasSubmitted(true);
        }
      }
    });

    return () => unsubscribe();
  }, [roundId, user]);

  const handleRatingChange = (participantId: string, criterion: keyof Evaluation, value: number | string) => {
    setEvaluations(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [criterion]: value,
        evaluatedBy: user?.email || 'Unknown'
      }
    }));
  };

  const isEvaluationComplete = () => {
    if (!round) return false;
    const otherParticipants = Object.keys(round.participants).filter(id => id !== user?.id);

    return otherParticipants.every(participantId => {
      const evaluation = evaluations[participantId];
      return evaluation &&
        typeof evaluation.presentation === 'number' &&
        typeof evaluation.taste === 'number';
    });
  };

  const handleSubmit = async () => {
    if (!round || !user || !isEvaluationComplete()) return;

    try {
      const db = getDatabase();
      await update(ref(db, `rounds/${roundId}/evaluations/${user.id}`), evaluations);
      setHasSubmitted(true);
      if (onEvaluationComplete) {
        onEvaluationComplete();
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  if (!round || !user) return null;

  const otherParticipants = Object.entries(round.participants)
    .filter(([id]) => id !== user.id) as [string, RoundParticipant][];

  if (hasSubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Evaluaciones</h2>
        <div className="space-y-8">
          {Object.entries(round.evaluations || {}).map(([evaluatorId, evaluations]) => (
            <div key={evaluatorId} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Evaluaciones de {round.participants[evaluatorId].name}</h3>
              <div className="space-y-4">
                {Object.entries(evaluations).map(([participantId, evaluation]) => {
                  const participant = round.participants[participantId];
                  return (
                    <div key={participantId} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">
                        {participant.name} - {formatDishName(participant.dishId || '')}
                      </p>
                      <p>Presentación: {evaluation.presentation}/5</p>
                      <p>Sabor: {evaluation.taste}/5</p>
                      {evaluation.comments && (
                        <p className="mt-2 text-gray-600 italic">"{evaluation.comments}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Evaluación de Platillos</h2>

      <div className="space-y-8">
        {otherParticipants.map(([participantId, participant]) => (
          <div key={participantId} className="p-4 border rounded-lg">
            <h3 className="text-xl font-semibold mb-4">
              {participant.name} - {formatDishName(participant.dishId || '')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Presentación</label>
                <RatingScale
                  value={evaluations[participantId]?.presentation || 0}
                  onChange={(value) => handleRatingChange(participantId, 'presentation', value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sabor</label>
                <RatingScale
                  value={evaluations[participantId]?.taste || 0}
                  onChange={(value) => handleRatingChange(participantId, 'taste', value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comentarios (opcional)</label>
                <textarea
                  value={evaluations[participantId]?.comments || ''}
                  onChange={(e) => handleRatingChange(participantId, 'comments', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Escribe tus comentarios aquí..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={!isEvaluationComplete()}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Guardar Evaluaciones
        </button>
      </div>
    </div>
  );
}