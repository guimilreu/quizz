import React, { useState, useEffect } from "react";
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react";

const EnhancedResults = ({ gameResults }) => {
	const [animatedScores, setAnimatedScores] = useState(
		gameResults.ranking.map(() => 0)
	);

	useEffect(() => {
		// Animar os pontos aumentando gradualmente
		gameResults.ranking.forEach((player, index) => {
			const timer = setTimeout(() => {
				let currentScore = 0;
				const interval = setInterval(() => {
					if (currentScore >= player.score) {
						clearInterval(interval);
						return;
					}

					currentScore += Math.max(Math.floor(player.score / 20), 1);
					if (currentScore > player.score)
						currentScore = player.score;

					setAnimatedScores((prev) => {
						const newScores = [...prev];
						newScores[index] = currentScore;
						return newScores;
					});
				}, 50);
			}, index * 300);

			return () => clearTimeout(timer);
		});
	}, [gameResults]);

	// Função para determinar o movimento no ranking
	const getRankMovement = (player) => {
		// Aqui você pode implementar lógica para rastrear mudanças de posição
		// Por enquanto, retorna valores aleatórios para demonstração
		const movements = [1, 0, -1];
		return movements[Math.floor(Math.random() * movements.length)];
	};

	return (
		<div className="flex flex-col gap-6 items-center animate-in fade-in duration-500">
			<h1 className="text-3xl font-bold text-white">Resultado Final</h1>

			<div className="w-full max-w-md">
				{/* Top 3 com destaque especial */}
				<div className="flex justify-center items-end gap-4 mb-8">
					{gameResults.ranking.slice(0, 3).map((player, idx) => (
						<div
							key={player.id}
							className={`
                flex flex-col items-center animate-in zoom-in delay-${idx * 200}
                ${
					idx === 0
						? "order-2 scale-110"
						: idx === 1
						? "order-1"
						: "order-3"
				}
              `}
							style={{ animationDelay: `${idx * 200}ms` }}
						>
							<div
								className={`
                  w-14 h-14 rounded-full flex items-center justify-center mb-2
                  ${
						idx === 0
							? "bg-yellow-500"
							: idx === 1
							? "bg-gray-300"
							: "bg-amber-700"
					}
                `}
							>
								<span className="text-2xl font-bold">
									{idx + 1}
								</span>
							</div>
							<div
								className={`
                  w-full py-4 px-4 rounded-lg text-center
                  ${
						idx === 0
							? "bg-yellow-500/20"
							: idx === 1
							? "bg-gray-300/20"
							: "bg-amber-700/20"
					}
                `}
							>
								<div className="text-white font-bold">
									{player.name}
								</div>
								<div className="text-white/80 text-2xl font-bold">
									{animatedScores[idx]} pts
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Restante dos jogadores */}
				<div className="bg-white/10 rounded-xl overflow-hidden">
					<div className="p-4 bg-rose-500 text-white font-bold text-center">
						<Trophy size={24} className="inline-block mr-2" />
						Ranking Completo
					</div>

					{gameResults.ranking.map((player, index) => {
						const rankMovement = getRankMovement(player);

						return (
							<div
								key={player.id}
								className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors animate-in slide-in-from-right"
								style={{ animationDelay: `${index * 100}ms` }}
							>
								<div className="flex items-center gap-3">
									<span
										className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold
                    ${
						player.rank === 1
							? "bg-yellow-500 text-yellow-900"
							: player.rank === 2
							? "bg-gray-300 text-gray-800"
							: player.rank === 3
							? "bg-amber-700 text-amber-100"
							: "bg-white/20 text-white"
					}
                  `}
									>
										{player.rank}
									</span>
									<span className="text-white font-medium">
										{player.name}
									</span>
								</div>
								<div className="flex items-center gap-2">
									{rankMovement > 0 && (
										<ChevronUp
											size={16}
											className="text-green-500"
										/>
									)}
									{rankMovement < 0 && (
										<ChevronDown
											size={16}
											className="text-rose-500"
										/>
									)}
									{rankMovement === 0 && (
										<Minus
											size={16}
											className="text-gray-400"
										/>
									)}
									<span className="text-white font-bold">
										{animatedScores[index]} pts
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default EnhancedResults;
