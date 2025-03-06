// Exemplos de como implementar as melhorias no GameRoom.jsx
import React, { useState, useEffect } from "react";
import { socket } from "@/lib/socket";
import { ArrowLeft, Users, Clock, Trophy, X, Copy } from "lucide-react";
import { useToast } from "@/context/ToastContext";

// Importar os novos componentes
import ProgressTimer from "@/components/ProgressTimer";
import Button from "@/components/Button";
import PlayerList from "@/components/PlayerList";
import AnimatedQuestion from "@/components/AnimatedQuestion";
import EnhancedResults from "@/components/EnhancedResults";
import Confetti from "@/components/Confetti";
import useCountdown from "@/hooks/useCountdown";

const GameRoom = ({ quiz, setCurrentPage, username, refreshQuizzes }) => {
	const { showSuccess, showError, showInfo } = useToast();

	const [roomId, setRoomId] = useState(null);
	const [players, setPlayers] = useState([]);
	const [gameState, setGameState] = useState("waiting"); // waiting, playing, results, finished
	const [currentQuestion, setCurrentQuestion] = useState(null);
	const [questionNumber, setQuestionNumber] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(0);
	const [questionResults, setQuestionResults] = useState(null);
	const [gameResults, setGameResults] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	// Usar nosso hook personalizado para contador
	const {
		seconds: countdown,
		start: startCountdown,
		percentageLeft,
	} = useCountdown(60, () => {
		// Callback quando o contador chegar a zero
		if (gameState === "playing") {
			nextQuestion();
		}
	});

	useEffect(() => {
		// Criar a sala assim que o componente for montado
		socket.emit("create_room", {
			quiz,
			hostName: username,
		});

		// Evento de sala criada
		const handleRoomCreated = (data) => {
			showSuccess(`Sala criada com sucesso! Código: ${data.roomId}`);
			setRoomId(data.roomId);
		};

		// Evento de jogador entrou
		const handlePlayerJoined = (data) => {
			console.log("Jogador entrou:", data);
			setPlayers(data.players);
			// Adicionar animação de toast melhorada
			showSuccess(`${data.playerName} entrou na sala!`, 2000);
		};

		// Evento de jogador saiu
		const handlePlayerLeft = (data) => {
			console.log("Jogador saiu:", data);
			setPlayers(data.players);
			// Adicionar toast com animação
			showInfo(`Um jogador saiu da sala`, 2000);
		};

		// Evento de jogador respondeu
		const handlePlayerAnswered = (data) => {
			console.log("Jogador respondeu:", data);
			// Atualizar visualmente que o jogador respondeu
			setPlayers((prevPlayers) =>
				prevPlayers.map((player) =>
					player.id === data.playerId
						? { ...player, answered: true }
						: player
				)
			);
		};

		// Evento de pergunta
		const handleQuestion = (data) => {
			console.log("Nova pergunta:", data);
			setGameState("playing");
			setCurrentQuestion(data.questionData);
			setQuestionNumber(data.questionNumber);
			setTotalQuestions(data.totalQuestions);
			setQuestionResults(null);

			// Resetar status de resposta dos jogadores
			setPlayers((prevPlayers) =>
				prevPlayers.map((player) => ({ ...player, answered: false }))
			);

			// Iniciar contagem regressiva com o hook
			startCountdown(data.timeLimit || 60);
		};

		// Evento de resultados da pergunta
		const handleQuestionResults = (data) => {
			console.log("Resultados da pergunta:", data);
			setGameState("results");
			setQuestionResults(data);

			// Atualizar pontuações dos jogadores
			setPlayers(data.playerScores);
		};

		// Evento de fim de jogo
		const handleGameOver = (data) => {
			console.log("Fim de jogo:", data);
			setGameState("finished");
			setGameResults(data);
			// Mostrar confetes!
			setShowConfetti(true);
		};

		// Evento de erro
		const handleError = (data) => {
			console.error("Erro:", data.message);
			showError(data.message);
		};

		// Evento de sala fechada (quando outro host sai)
		const handleRoomClosed = (data) => {
			showInfo("O host fechou a sala.");
			setCurrentPage(null);
		};

		// Registrar eventos
		socket.on("room_created", handleRoomCreated);
		socket.on("player_joined", handlePlayerJoined);
		socket.on("player_left", handlePlayerLeft);
		socket.on("player_answered", handlePlayerAnswered);
		socket.on("question", handleQuestion);
		socket.on("question_results", handleQuestionResults);
		socket.on("game_over", handleGameOver);
		socket.on("error", handleError);
		socket.on("room_closed", handleRoomClosed);

		// Limpeza ao desmontar
		return () => {
			socket.off("room_created", handleRoomCreated);
			socket.off("player_joined", handlePlayerJoined);
			socket.off("player_left", handlePlayerLeft);
			socket.off("player_answered", handlePlayerAnswered);
			socket.off("question", handleQuestion);
			socket.off("question_results", handleQuestionResults);
			socket.off("game_over", handleGameOver);
			socket.off("error", handleError);
			socket.off("room_closed", handleRoomClosed);
		};
	}, [
		quiz,
		username,
		setCurrentPage,
		showSuccess,
		showError,
		showInfo,
		startCountdown,
	]);

	// Função para iniciar o jogo
	const startGame = () => {
		if (players.length === 0) {
			showError("Você precisa de pelo menos um jogador para iniciar!");
			return;
		}

		setLoading(true);
		socket.emit("start_game");
		showInfo("Iniciando o jogo...");

		// Simular um pequeno delay para feedback visual
		setTimeout(() => {
			setLoading(false);
		}, 500);
	};

	// Função para avançar para próxima pergunta manualmente
	const nextQuestion = () => {
		if (gameState === "playing" || gameState === "results") {
			setLoading(true);
			socket.emit("next_question");

			// Simular um pequeno delay para feedback visual
			setTimeout(() => {
				setLoading(false);
			}, 300);
		}
	};

	// Função para copiar o código da sala para o clipboard
	const copyRoomCode = () => {
		navigator.clipboard.writeText(roomId);
		showInfo("Código da sala copiado para a área de transferência!");
	};

	// Função para voltar ao lobby
	const backToLobby = () => {
		if (
			gameState !== "waiting" &&
			!window.confirm(
				"Tem certeza que deseja sair? O jogo será encerrado."
			)
		) {
			return;
		}
		setCurrentPage(null);
	};

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-4">
			{showConfetti && <Confetti />}

			{/* Tela de espera */}
			{gameState === "waiting" && (
				<div className="flex flex-col gap-6 items-center animate-in fade-in">
					<div className="flex items-center justify-between w-full">
						<button
							onClick={backToLobby}
							className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
						>
							<ArrowLeft size={24} className="text-white/70" />
						</button>
						<h1 className="text-3xl font-bold text-center text-white">
							{quiz.title}
						</h1>
						<div className="w-10"></div>{" "}
						{/* Espaçador para centralizar título */}
					</div>

					{roomId && (
						<div className="flex flex-col gap-4 items-center bg-white/10 p-6 rounded-xl w-full max-w-md animate-in slide-in-from-top">
							<h2 className="text-xl text-white font-semibold">
								Sala Criada!
							</h2>

							<div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
								<span className="text-2xl font-bold text-white">
									{roomId}
								</span>
								<button
									onClick={copyRoomCode}
									className="p-2 rounded-full hover:bg-white/10 transition"
									title="Copiar código"
								>
									<Copy size={18} className="text-white" />
								</button>
							</div>

							<p className="text-white/80 text-center">
								Compartilhe este código com os jogadores para
								entrarem na sala.
							</p>
						</div>
					)}

					<div className="w-full max-w-md animate-in slide-in-from-bottom">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-white font-semibold text-lg">
								Lista de Jogadores
							</h3>
							{players.length > 0 && (
								<Button
									onClick={startGame}
									variant="primary"
									loading={loading}
								>
									Iniciar Quiz
								</Button>
							)}
						</div>

						<PlayerList players={players} />
					</div>
				</div>
			)}

			{/* Tela de jogo - pergunta */}
			{gameState === "playing" && currentQuestion && (
				<div className="flex flex-col gap-6">
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-white/60 text-sm">
								Pergunta {questionNumber} de {totalQuestions}
							</h2>
							<h1 className="text-2xl font-bold text-white">
								{currentQuestion.title}
							</h1>
						</div>

						<div className="flex flex-col gap-2 bg-white/10 px-4 py-3 rounded-lg">
							<div className="flex items-center gap-2">
								<Clock size={18} className="text-white/70" />
								<span
									className={`text-xl font-bold ${
										countdown < 10
											? "text-rose-500"
											: "text-white"
									}`}
								>
									{countdown}s
								</span>
							</div>
							<ProgressTimer
								totalTime={60}
								currentTime={countdown}
							/>
						</div>
					</div>

					{/* Componente de pergunta animado */}
					<AnimatedQuestion
						question={currentQuestion}
						hasAnswered={false}
						onSelectOption={() => {}}
						countdown={countdown}
					/>

					<div className="mt-4">
						<h3 className="text-white font-semibold mb-2">
							Jogadores que responderam:{" "}
							{players.filter((p) => p.answered).length}/
							{players.length}
						</h3>

						<PlayerList
							players={players}
							title="Status dos Jogadores"
						/>
					</div>

					<Button
						onClick={nextQuestion}
						className="mt-4 w-full sm:w-auto mx-auto"
						loading={loading}
					>
						Próxima Pergunta
					</Button>
				</div>
			)}

			{/* Tela de resultados da pergunta */}
			{gameState === "results" && questionResults && (
				<div className="flex flex-col gap-6 animate-in fade-in">
					<h1 className="text-2xl font-bold text-white text-center">
						Resultados da Pergunta {questionResults.questionNumber}
					</h1>

					<div className="bg-white/10 p-6 rounded-xl animate-in slide-in-from-bottom">
						<div className="flex flex-col gap-4 items-center">
							<div className="text-center">
								<h2 className="text-xl text-white font-semibold">
									Resposta Correta
								</h2>
								<p className="text-white/80 mt-1 text-lg font-medium">
									{questionResults.correctOptionText}
								</p>
							</div>

							<div className="w-full">
								<h3 className="text-white font-semibold mb-2">
									Placar Atual
								</h3>
								<PlayerList
									players={players}
									showRank={true}
									title="Ranking"
								/>
							</div>
						</div>
					</div>

					<Button
						onClick={nextQuestion}
						className="w-full sm:w-auto mx-auto"
						loading={loading}
					>
						Próxima Pergunta
					</Button>
				</div>
			)}

			{/* Tela de fim de jogo com confetes */}
			{gameState === "finished" && gameResults && (
				<>
					<EnhancedResults gameResults={gameResults} />

					<div className="mt-8 flex justify-center">
						<Button onClick={backToLobby} variant="secondary">
							Voltar ao Lobby
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default GameRoom;
