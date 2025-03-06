import React, { memo } from "react";
import { Users } from "lucide-react";

// Componente PlayerItem otimizado com memo para evitar re-renderizações desnecessárias
const PlayerItem = memo(({ player, rank }) => {
	return (
		<div
			className={`
      flex items-center justify-between p-4
      border-b border-white/10 last:border-b-0
      transition-colors hover:bg-white/5
    `}
		>
			<div className="flex items-center gap-2">
				{rank !== undefined && (
					<span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-white text-xs">
						{rank}
					</span>
				)}
				<span className="text-white">{player.name}</span>
				{player.answered && (
					<span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
						Respondeu
					</span>
				)}
			</div>
			{player.score > 0 && (
				<span className="text-white/70 text-sm font-semibold">
					{player.score} pts
				</span>
			)}
		</div>
	);
});

// Lista principal
const PlayerList = ({ players, title = "Jogadores", showRank = false }) => {
	// Se necessário, podemos ordenar os jogadores por pontuação
	const sortedPlayers = showRank
		? [...players].sort((a, b) => b.score - a.score)
		: players;

	return (
		<div className="w-full">
			<div className="flex items-center gap-2 mb-2">
				<Users size={18} className="text-white/70" />
				<h3 className="text-white font-semibold">
					{title} ({players.length})
				</h3>
			</div>

			<div className="bg-white/5 rounded-lg overflow-hidden">
				{players.length === 0 ? (
					<div className="p-4 text-white/50 text-center">
						Nenhum jogador encontrado
					</div>
				) : (
					sortedPlayers.map((player, index) => (
						<PlayerItem
							key={player.id}
							player={player}
							rank={showRank ? index + 1 : undefined}
						/>
					))
				)}
			</div>
		</div>
	);
};

export default PlayerList;
