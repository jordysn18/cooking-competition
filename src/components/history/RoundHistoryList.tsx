'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import RoundHistoryCard from './RoundHistoryCard';
import RoundHistoryDetails from './RoundHistoryDetails';

interface HistoricalRound {
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
}

export default function RoundHistoryList() {
    const [rounds, setRounds] = useState<HistoricalRound[]>([]);
    const [selectedRound, setSelectedRound] = useState<HistoricalRound | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getDatabase();
        const historyRef = ref(db, 'roundHistory');

        const unsubscribe = onValue(historyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roundsArray = Object.entries(data).map(([id, round]: [string, any]) => ({
                    id,
                    ...round,
                }));
                // Ordenar por fecha, más reciente primero
                setRounds(roundsArray.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p className="text-gray-500">Cargando historial...</p>
            </div>
        );
    }

    if (rounds.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No hay rondas en el historial.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rounds.map((round, index) => (
                    <RoundHistoryCard
                        key={round.id}
                        roundNumber={rounds.length - index}
                        date={round.date}
                        categoryName={round.categoryName}
                        participants={Object.keys(round.participants).length}
                        onClick={() => setSelectedRound(round)}
                    />
                ))}
            </div>

            {selectedRound && (
                <RoundHistoryDetails
                    round={selectedRound}
                    onClose={() => setSelectedRound(null)}
                />
            )}
        </>
    );
}