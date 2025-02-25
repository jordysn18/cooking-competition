'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, get, update, push } from 'firebase/database';
import { formatDishName } from '@/utils/format';

interface Evaluation {
    presentation: number;
    taste: number;
    comments?: string;
    evaluatedBy: string;
}

interface ParticipantScore {
    participantId: string;
    name: string;
    dishName: string;
    averageScore: number;
    presentationAvg: number;
    tasteAvg: number;
    comments: string[];
}

export default function RoundResults({ roundId }: { roundId: string }) {
    const [scores, setScores] = useState<ParticipantScore[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [round, setRound] = useState<any>(null);

    const saveToHistory = async (roundData: any, scores: ParticipantScore[]) => {
        const db = getDatabase();
        const historyRef = ref(db, 'roundHistory');

        try {
            // Obtener el nombre de la categoría
            const categoryRef = ref(db, `categories/${roundData.categoryId}`);
            const categorySnapshot = await get(categoryRef);
            const categoryData = categorySnapshot.val();

            const historicalData = {
                date: roundData.date,
                categoryName: categoryData?.name || 'Categoría Desconocida',
                participants: scores.reduce((acc, score) => ({
                    ...acc,
                    [score.participantId]: {
                        name: score.name,
                        dishName: score.dishName,
                        scores: {
                            presentation: score.presentationAvg,
                            taste: score.tasteAvg,
                            average: score.averageScore,
                        },
                        comments: score.comments
                    }
                }), {}),
                winner: {
                    name: scores[0].name,
                    dishName: scores[0].dishName,
                    score: scores[0].averageScore
                }
            };

            await push(historyRef, historicalData);
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    const handleFinishRound = async () => {
        if (!roundId) return;

        const db = getDatabase();
        try {
            // Actualizar el estado de la ronda a 'completed'
            await update(ref(db, `rounds/${roundId}`), {
                status: 'completed'
            });

            // Guardar en el historial si aún no se ha guardado
            if (!round?.savedToHistory) {
                await saveToHistory(round, scores);
                await update(ref(db, `rounds/${roundId}`), {
                    savedToHistory: true
                });
            }

            // Redireccionar a la página principal
            window.location.href = '/';
        } catch (error) {
            console.error('Error finishing round:', error);
        }
    };

    useEffect(() => {
        const db = getDatabase();
        const roundRef = ref(db, `rounds/${roundId}`);

        const unsubscribe = onValue(roundRef, (snapshot) => {
            const roundData = snapshot.val();
            if (!roundData) return;

            setRound(roundData);

            const { participants, evaluations } = roundData;
            if (!evaluations) return;

            // Verificar si todos han evaluado
            const totalParticipants = Object.keys(participants).length;
            const totalEvaluators = Object.keys(evaluations).length;

            // Cada participante debe evaluar a todos menos a sí mismo
            const expectedEvaluationsPerPerson = totalParticipants - 1;
            const allEvaluationsComplete = Object.values(evaluations).every(
                (evalData: any) => Object.keys(evalData).length === expectedEvaluationsPerPerson
            );

            setIsComplete(totalEvaluators === totalParticipants && allEvaluationsComplete);

            if (allEvaluationsComplete) {
                // Calcular puntuaciones
                const participantScores: ParticipantScore[] = Object.entries(participants).map(([participantId, participant]: [string, any]) => {
                    const allEvaluations = Object.values(evaluations).map((evalData: any) => evalData[participantId]).filter(Boolean);
                    const presentationScores = allEvaluations.map(e => e.presentation);
                    const tasteScores = allEvaluations.map(e => e.taste);
                    const comments = allEvaluations.map(e => e.comments).filter(Boolean);

                    const presentationAvg = presentationScores.reduce((a, b) => a + b, 0) / presentationScores.length;
                    const tasteAvg = tasteScores.reduce((a, b) => a + b, 0) / tasteScores.length;
                    const averageScore = (presentationAvg + tasteAvg) / 2;

                    return {
                        participantId,
                        name: participant.name,
                        dishName: participant.dishId,
                        averageScore,
                        presentationAvg,
                        tasteAvg,
                        comments
                    };
                });

                // Ordenar por puntuación promedio
                setScores(participantScores.sort((a, b) => b.averageScore - a.averageScore));
            }
        });

        return () => unsubscribe();
    }, [roundId]);

    if (!isComplete) {
        return (
            <div className="text-center p-4">
                <p className="text-gray-600">
                    Los resultados estarán disponibles cuando todos los participantes hayan completado sus evaluaciones.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Resultados Finales</h2>

            {/* Podio de ganadores */}
            <div className="flex justify-center items-end mb-12 space-x-4">
                {scores.slice(0, 3).map((score, index) => (
                    <div
                        key={score.participantId}
                        className={`flex flex-col items-center ${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'
                            }`}
                    >
                        <div className="text-center mb-2">
                            <p className="font-bold">{score.name}</p>
                            <p className="text-sm text-gray-600">{formatDishName(score.dishName)}</p>
                            <p className="text-lg font-semibold">{score.averageScore.toFixed(1)}</p>
                        </div>
                        <div
                            className={`w-24 ${index === 0
                                    ? 'h-32 bg-green-500' // Primer lugar: Verde
                                    : index === 1
                                        ? 'h-24 bg-blue-300' // Segundo lugar: Azul claro
                                        : 'h-20 bg-yellow-500' // Tercer lugar: Amarillo
                                } rounded-t-lg`}
                        >
                            <div className="text-white text-2xl font-bold text-center pt-2">
                                {index + 1}º
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla de puntuaciones */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platillo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presentación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sabor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {scores.map((score, index) => (
                            <tr key={score.participantId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDishName(score.dishName)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.presentationAvg.toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.tasteAvg.toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.averageScore.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Botón de finalizar ronda */}
            <div className="mt-8 text-center">
                <button
                    onClick={handleFinishRound}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    Finalizar Ronda
                </button>
            </div>

            {/* Comentarios */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Comentarios recibidos</h3>
                <div className="space-y-4">
                    {scores.map((score) => (
                        score.comments.length > 0 && (
                            <div key={score.participantId} className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium mb-2">{score.name} - {formatDishName(score.dishName)}</p>
                                {score.comments.map((comment, i) => (
                                    <p key={i} className="text-gray-600 italic pl-4">"{comment}"</p>
                                ))}
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}