interface RoundHistoryCardProps {
    roundNumber: number;
    date: string;
    categoryName: string;
    participants: number;
    onClick: () => void;
}

export default function RoundHistoryCard({
    roundNumber,
    date,
    categoryName,
    participants,
    onClick
}: RoundHistoryCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold mb-2">Ronda #{roundNumber}</h3>
                    <p className="text-gray-600">
                        {new Date(date + 'T00:00:00').toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Categoría</p>
                    <p className="font-medium">{categoryName}</p>
                </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                {participants} participantes
            </div>
        </div>
    );
}