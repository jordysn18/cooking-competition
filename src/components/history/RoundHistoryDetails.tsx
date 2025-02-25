import { formatDishName } from '@/utils/format';

interface RoundHistoryDetailsProps {
    round: {
        id: string;
        date: string;
        categoryName: string;
        participants: {
            [key: string]: {
                name: string;
                dishName: string;
                scores: {
                    presentation: number;
                    taste: number;
                    average: number;
                };
                comments: string[];
            };
        };
        winner: {
            name: string;
            dishName: string;
            score: number;
        };
    };
    onClose: () => void;
}

export default function RoundHistoryDetails({ round, onClose }: RoundHistoryDetailsProps) {
    const sortedParticipants = Object.entries(round.participants)
        .map(([id, data]) => ({
            id,
            ...data,
        }))
        .sort((a, b) => b.scores.average - a.scores.average);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            Detalles de la Ronda - {new Date(round.date + 'T00:00:00').toLocaleDateString()}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2">Categoría: {round.categoryName}</p>
                </div>

                <div className="p-6">
                    {/* Ganador */}
                    <div className="mb-8 p-4 bg-green-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">🏆 Ganador de la Ronda</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{formatDishName(round.winner.name)}</p>
                                <p className="text-gray-600">{formatDishName(round.winner.dishName)}</p>
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {round.winner.score.toFixed(1)}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de resultados */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Resultados Finales</h3>
                        {/* Añadimos un contenedor con overflow */}
                        <div className="overflow-x-auto w-full">
                            <div className="min-w-[800px]"> {/* Ancho mínimo para asegurar scroll en móvil */}
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
                                    <tbody className="divide-y divide-gray-200">
                                        {sortedParticipants.map((participant, index) => (
                                            <tr key={participant.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDishName(participant.name)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDishName(participant.dishName)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.scores.presentation.toFixed(1)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.scores.taste.toFixed(1)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.scores.average.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Comentarios */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Comentarios</h3>
                        <div className="space-y-4">
                            {sortedParticipants.map((participant) => (
                                // Verificar que comments existe y tiene elementos
                                participant.comments && participant.comments.length > 0 && (
                                    <div key={participant.id} className="bg-gray-50 p-4 rounded-lg">
                                        <p className="font-medium mb-2">
                                            {formatDishName(participant.name)} - {formatDishName(participant.dishName)}
                                        </p>
                                        {participant.comments.map((comment, i) => (
                                            <p key={i} className="text-gray-600 italic pl-4">"{comment}"</p>
                                        ))}
                                    </div>
                                )
                            ))}
                            {/* Mostrar mensaje si no hay comentarios */}
                            {!sortedParticipants.some(p => p.comments && p.comments.length > 0) && (
                                <p className="text-gray-500 text-center">No hay comentarios para esta ronda.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}