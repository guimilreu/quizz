import React, { useState, useEffect } from "react";
import { socket } from "@/lib/socket";
import { useToast } from '@/context/ToastContext';

import { ArrowLeft, Users, Clock, Trophy } from "lucide-react";

const JoinRoom = ({ setCurrentPage, username }) => {
	const { showSuccess, showError, showInfo } = useToast();

	const [step, setStep] = useState("join"); // join, waiting, playing, results, finished
	const [roomCode, setRoomCode] = useState("");
	const [error, setError] = useState("");
	const [roomInfo, setRoomInfo] = useState(null);
	const [currentQuestion, setCurrentQuestion] = useState(null);
	const [questionNumber, setQuestionNumber] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(0);
	const [selectedOption, setSelectedOption] = useState(null);
	const [hasAnswered, setHasAnswered] = useState(false);
	const [countdown, setCountdown] = useState(null);
	const [countdownInterval, setCountdownInterval] = useState(null);
	const [questionResults, setQuestionResults] = useState(null);
	const [gameResults, setGameResults] = useState(null);
	const [players, setPlayers] = useState([]);

	useEffect(() => {
		// Evento para quando entrar na sala com sucesso
		const handleRoomJoined = (data) => {
			showSuccess("Entrou na sala com sucesso!");
			setRoomInfo(data);
			setPlayers(data.players);
			setStep("waiting");
		};

		// Evento para quando um jogador entra na sala
		const handlePlayerJoined = (data) => {
			showInfo(`${data.playerName} entrou na sala`);
			setPlayers(data.players);
		};

		// Evento para quando um jogador sai da sala
		const handlePlayerLeft = (data) => {
			showInfo(`${data.playerName} saiu da sala`);
			setPlayers(data.players);
		};

		// Evento para quando um jogo começa
		const handleQuestion = (data) => {
			setStep("playing");
			setCurrentQuestion(data.questionData);
			setQuestionNumber(data.questionNumber);
			setTotalQuestions(data.totalQuestions);
			setHasAnswered(false);
			setSelectedOption(null);
			setQuestionResults(null);

			// Iniciar contagem regressiva
			startCountdown(data.timeLimit || 60);
		};

		// Evento para resultados da pergunta
		const handleQuestionResults = (data) => {
			console.log("Resultados da pergunta:", data);
			setStep("results");
			setQuestionResults(data);
			setPlayers(data.playerScores);

			// Parar contagem regressiva
			if (countdownInterval) {
				clearInterval(countdownInterval);
				setCountdownInterval(null);
			}
		};

		// Evento para confirmação de resposta
		const handleAnswerConfirmed = () => {
			console.log("Resposta confirmada!");
			setHasAnswered(true);
		};

		// Evento para fim do jogo
		const handleGameOver = (data) => {
			console.log("Fim de jogo:", data);
			setStep("finished");
			setGameResults(data);

			// Limpar contagem regressiva
			if (countdownInterval) {
				clearInterval(countdownInterval);
				setCountdownInterval(null);
			}
		};

		// Evento para sala fechada (quando o host sai)
		const handleRoomClosed = (data) => {
			showInfo("A sala foi fechada pelo host");
			setCurrentPage(null);
		};

		// Evento para erros
		const handleError = (data) => {
			console.error("Erro:", data.message);
			showError(data.message);
			setError(data.message);
			setTimeout(() => setError(""), 3000);
		};

		// Registrar eventos
		socket.on("room_joined", handleRoomJoined);
		socket.on("player_joined", handlePlayerJoined);
		socket.on("player_left", handlePlayerLeft);
		socket.on("question", handleQuestion);
		socket.on("question_results", handleQuestionResults);
		socket.on("answer_confirmed", handleAnswerConfirmed);
		socket.on("game_over", handleGameOver);
		socket.on("room_closed", handleRoomClosed);
		socket.on("error", handleError);

		// Limpeza ao desmontar
		return () => {
			socket.off("room_joined", handleRoomJoined);
			socket.off("player_joined", handlePlayerJoined);
			socket.off("player_left", handlePlayerLeft);
			socket.off("question", handleQuestion);
			socket.off("question_results", handleQuestionResults);
			socket.off("answer_confirmed", handleAnswerConfirmed);
			socket.off("game_over", handleGameOver);
			socket.off("room_closed", handleRoomClosed);
			socket.off("error", handleError);

			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
		};
	}, [countdownInterval, setCurrentPage]);

	// Função para iniciar contagem regressiva
	const startCountdown = (seconds) => {
		// Limpar qualquer intervalo existente
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}

		setCountdown(seconds);

		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					setCountdownInterval(null);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		setCountdownInterval(interval);
	};

	// Função para entrar na sala
	const handleJoinRoom = (e) => {
		e.preventDefault();

		if (!roomCode.trim()) {
			setError("Digite o código da sala");
			return;
		}

		socket.emit("join_room", {
			roomId: roomCode.trim().toUpperCase(),
			playerName: username,
		});
	};

	// Função para enviar resposta
	const handleSubmitAnswer = (optionIndex) => {
		if (hasAnswered) return;

		socket.emit("submit_answer", {
			optionIndex,
		});

		setSelectedOption(optionIndex);
	};

	// Função para voltar para a tela inicial
	const handleBackToHome = () => {
		setCurrentPage(null);
	};

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-4">
			{/* Tela de entrada na sala */}
			{step === "join" && (
				<div className="flex flex-col gap-6 items-center">
					<div className="flex items-center justify-between w-full">
						<button
							onClick={handleBackToHome}
							className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
						>
							<ArrowLeft size={24} className="text-white/70" />
						</button>
						<h1 className="text-3xl font-bold text-center text-white">
							Entrar em Sala
						</h1>
						<div className="w-10"></div>{" "}
						{/* Espaçador para centralizar título */}
					</div>

					<form
						onSubmit={handleJoinRoom}
						className="flex flex-col gap-4 w-full max-w-md"
					>
						<div className="flex flex-col gap-2">
							<label className="text-white">Código da Sala</label>
							<input
								type="text"
								value={roomCode}
								onChange={(e) =>
									setRoomCode(e.target.value.toUpperCase())
								}
								placeholder="Digite o código de 6 dígitos"
								className="bg-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
								maxLength={6}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-white">Seu Nome</label>
							<div className="bg-white/10 text-white p-3 rounded-lg">
								{username}
							</div>
							<p className="text-white/60 text-sm">
								Você pode alterar seu nome na tela inicial.
							</p>
						</div>

						{error && (
							<p className="text-rose-400 text-center">{error}</p>
						)}

						<button
							type="submit"
							className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-semibold mt-2 transition"
						>
							Entrar na Sala
						</button>
					</form>
				</div>
			)}

			{/* Tela de espera */}
			{step === "waiting" && roomInfo && (
				<div className="flex flex-col gap-6 items-center">
					<div className="flex items-center justify-between w-full">
						<button
							onClick={handleBackToHome}
							className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
						>
							<ArrowLeft size={24} className="text-white/70" />
						</button>
						<h1 className="text-3xl font-bold text-center text-white">
							{roomInfo.quizTitle}
						</h1>
						<div className="w-10"></div>{" "}
						{/* Espaçador para centralizar título */}
					</div>

					<div className="bg-white/10 p-6 rounded-xl w-full max-w-md">
						<div className="text-center">
							<h2 className="text-xl text-white font-semibold mb-2">
								Aguardando início
							</h2>
							<p className="text-white/70">
								O host ({roomInfo.hostName}) irá iniciar o jogo
								em breve
							</p>
						</div>
					</div>

					<div className="w-full max-w-md">
						<div className="flex items-center gap-2 mb-2">
							<Users size={18} className="text-white/70" />
							<h3 className="text-white font-semibold">
								Jogadores ({players.length})
							</h3>
						</div>

						<div className="bg-white/5 rounded-lg overflow-hidden">
							{players.map((player, index) => (
								<div
									key={player.id}
									className={`
                                        flex items-center justify-between p-4
                                        ${
											index < players.length - 1
												? "border-b border-white/10"
												: ""
										}
                                    `}
								>
									<span className="text-white">
										{player.name}
									</span>
									{player.score > 0 && (
										<span className="text-white/70 text-sm">
											{player.score} pts
										</span>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Tela de jogo - pergunta */}
			{step === "playing" && currentQuestion && (
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

						<div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
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
					</div>

					{/* Grade de opções */}
					<div className="grid grid-cols-2 gap-4">
						{currentQuestion.options.map((option, index) => (
							<button
								key={index}
								onClick={() => handleSubmitAnswer(index)}
								disabled={hasAnswered}
								className={`
                                    relative rounded-xl overflow-hidden border-2 h-48
                                    ${
										hasAnswered
											? "opacity-60"
											: "hover:opacity-90 transition"
									}
                                    ${
										selectedOption === index
											? "ring-4 ring-white"
											: ""
									}
                                `}
								style={{
									borderColor: [
										"#E21B3C",
										"#1368CE",
										"#FFA602",
										"#26890C",
									][index],
									cursor: hasAnswered ? "default" : "pointer",
								}}
							>
								{option.image ? (
									<div
										className="w-full h-full bg-center bg-cover flex items-end justify-center"
										style={{
											backgroundImage: `url(${option.image})`,
										}}
									>
										<div
											className="w-full py-3 px-4 text-center text-white font-semibold"
											style={{
												backgroundColor: [
													"#E21B3C",
													"#1368CE",
													"#FFA602",
													"#26890C",
												][index],
											}}
										>
											{option.text}
										</div>
									</div>
								) : (
									<div
										className="w-full h-full flex items-center justify-center"
										style={{
											backgroundColor: [
												"#E21B3C",
												"#1368CE",
												"#FFA602",
												"#26890C",
											][index],
											opacity: 0.8,
										}}
									>
										<span className="text-white font-bold text-lg">
											{option.text}
										</span>
									</div>
								)}

								{hasAnswered && selectedOption === index && (
									<div className="absolute top-2 right-2 bg-white text-black font-bold text-sm p-1 px-2 rounded-full">
										Sua resposta
									</div>
								)}
							</button>
						))}
					</div>

					{hasAnswered && (
						<div className="bg-white/10 p-4 rounded-lg text-center text-white">
							<p>
								Resposta enviada! Aguardando os outros
								jogadores...
							</p>
						</div>
					)}
				</div>
			)}

			{/* Tela de resultados da pergunta */}
			{step === "results" && questionResults && (
				<div className="flex flex-col gap-6">
					<h1 className="text-2xl font-bold text-white text-center">
						Resultados da Pergunta {questionResults.questionNumber}
					</h1>

					<div className="bg-white/10 p-6 rounded-xl">
						<div className="flex flex-col gap-4 items-center">
							<div className="text-center">
								<h2 className="text-xl text-white font-semibold">
									Resposta Correta
								</h2>
								<p className="text-white/80 mt-1">
									{questionResults.correctOptionText}
								</p>
							</div>

							<div className="w-full">
								<h3 className="text-white font-semibold mb-2">
									Placar Atual
								</h3>
								<div className="bg-white/5 rounded-lg overflow-hidden">
									{players
										.slice(0, 5)
										.map((player, index) => (
											<div
												key={player.id}
												className={`
                                                flex items-center justify-between p-3
                                                ${
													index < players.length - 1
														? "border-b border-white/10"
														: ""
												}
                                            `}
											>
												<div className="flex items-center gap-2">
													<span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-white text-xs">
														{index + 1}
													</span>
													<span className="text-white">
														{player.name}
													</span>
												</div>
												<span className="text-white font-bold">
													{player.score}
												</span>
											</div>
										))}
								</div>
							</div>
						</div>
					</div>

					<p className="text-white/70 text-center">
						Aguardando próxima pergunta...
					</p>
				</div>
			)}

			{/* Tela de fim de jogo */}
			{step === "finished" && gameResults && (
				<div className="flex flex-col gap-6 items-center">
					<h1 className="text-3xl font-bold text-white">
						Resultado Final
					</h1>

					<div className="w-full max-w-md bg-white/10 rounded-xl overflow-hidden">
						<div className="p-4 bg-rose-500 text-white font-bold text-center">
							<Trophy size={24} className="inline-block mr-2" />
							Ranking
						</div>

						{gameResults.ranking.map((player) => (
							<div
								key={player.id}
								className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0"
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
								<span className="text-white font-bold">
									{player.score} pts
								</span>
							</div>
						))}
					</div>

					<button
						onClick={handleBackToHome}
						className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition"
					>
						Voltar ao Lobby
					</button>
				</div>
			)}
		</div>
	);
};

export default JoinRoom;
