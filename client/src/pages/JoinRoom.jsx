import React, { useState, useEffect } from "react";
import { socket } from "@/lib/socket";
import { useToast } from "@/context/ToastContext";

import { ArrowLeft, Users, Clock } from "lucide-react";

// Importar os novos componentes
import ProgressTimer from "@/components/ProgressTimer";
import Button from "@/components/Button";
import PlayerList from "@/components/PlayerList";
import AnimatedQuestion from "@/components/AnimatedQuestion";
import EnhancedResults from "@/components/EnhancedResults";
import Confetti from "@/components/Confetti";
import AnswerFeedback from "@/components/AnswerFeedback";
import useCountdown from "@/hooks/useCountdown";

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
	const [questionResults, setQuestionResults] = useState(null);
	const [gameResults, setGameResults] = useState(null);
	const [players, setPlayers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const [correctOptionIndex, setCorrectOptionIndex] = useState(null);
	const [showConfetti, setShowConfetti] = useState(false);

	// Usar o hook personalizado para o contador
	const {
		seconds: countdown,
		start: startCountdown,
		percentageLeft,
	} = useCountdown(60, () => {
		// O tempo acabou e o jogador não respondeu
		if (step === "playing" && !hasAnswered) {
			showInfo("Tempo esgotado!");
		}
	});

	useEffect(() => {
		// Evento para quando entrar na sala com sucesso
		const handleRoomJoined = (data) => {
			showSuccess("Entrou na sala com sucesso!");
			setRoomInfo(data);
			setPlayers(data.players);
			setStep("waiting");
			setLoading(false);
		};

		// Evento para quando um jogador entra na sala
		const handlePlayerJoined = (data) => {
			showInfo(`${data.playerName} entrou na sala`);
			setPlayers(data.players);
		};

		// Evento para quando um jogador sai da sala
		const handlePlayerLeft = (data) => {
			showInfo(`Um jogador saiu da sala`);
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
			setShowFeedback(false);

			// Iniciar contagem regressiva
			startCountdown(data.timeLimit || 60);
		};

		// Evento para resultados da pergunta
		const handleQuestionResults = (data) => {
			console.log("Resultados da pergunta:", data);
			setStep("results");
			setQuestionResults(data);
			setPlayers(data.playerScores);
			setCorrectOptionIndex(data.correctOptionIndex);

			// Mostrar feedback visual da resposta
			if (selectedOption !== null) {
				setShowFeedback(true);

				// Ocultar o feedback após alguns segundos
				setTimeout(() => {
					setShowFeedback(false);
				}, 2500);
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
			setShowConfetti(true);
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
			setLoading(false);
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
		};
	}, [
		setCurrentPage,
		showError,
		showInfo,
		showSuccess,
		selectedOption,
		startCountdown,
	]);

	// Função para entrar na sala
	const handleJoinRoom = (e) => {
		e.preventDefault();

		if (!roomCode.trim()) {
			setError("Digite o código da sala");
			return;
		}

		setLoading(true);
		socket.emit("join_room", {
			roomId: roomCode.trim().toUpperCase(),
			playerName: username,
		});
	};

	// Função para enviar resposta
	const handleSubmitAnswer = (optionIndex) => {
		if (hasAnswered) return;

		// Efeito visual de seleção
		setSelectedOption(optionIndex);

		// Pequeno delay para feedback visual antes de enviar
		setTimeout(() => {
			socket.emit("submit_answer", {
				optionIndex,
			});
		}, 200);
	};

	// Função para voltar para a tela inicial
	const handleBackToHome = () => {
		setCurrentPage(null);
	};

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-4">
			{showConfetti && <Confetti />}

			{/* Feedback visual para resposta */}
			{showFeedback && correctOptionIndex !== null && (
				<AnswerFeedback
					correctOptionIndex={correctOptionIndex}
					selectedOption={selectedOption}
					questionResults={questionResults?.playerResults}
				/>
			)}

			{/* Tela de entrada na sala */}
			{step === "join" && (
				<div className="flex flex-col gap-6 items-center animate-in fade-in">
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
						<div className="w-10"></div>
					</div>

					<form
						onSubmit={handleJoinRoom}
						className="flex flex-col gap-4 w-full max-w-md animate-in slide-in-from-bottom"
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
							<p className="text-rose-400 text-center animate-in fade-in">
								{error}
							</p>
						)}

						<Button
							type="submit"
							loading={loading}
							className="w-full mt-2"
						>
							Entrar na Sala
						</Button>
					</form>
				</div>
			)}

			{/* Tela de espera */}
			{step === "waiting" && roomInfo && (
				<div className="flex flex-col gap-6 items-center animate-in fade-in">
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
						<div className="w-10"></div>
					</div>

					<div className="bg-white/10 p-6 rounded-xl w-full max-w-md animate-in slide-in-from-top">
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

					<div className="w-full max-w-md animate-in slide-in-from-bottom">
						<PlayerList
							players={players}
							title="Jogadores na Sala"
						/>
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
						selectedOption={selectedOption}
						hasAnswered={hasAnswered}
						onSelectOption={handleSubmitAnswer}
						countdown={countdown}
					/>

					{hasAnswered && (
						<div className="bg-green-500/20 p-4 rounded-lg text-center text-white animate-in fade-in">
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
									players={players.slice(0, 5)}
									showRank={true}
									title="Ranking"
								/>
							</div>
						</div>
					</div>

					<p className="text-white/70 text-center">
						Aguardando próxima pergunta...
					</p>
				</div>
			)}

			{/* Tela de fim de jogo com confetes */}
			{step === "finished" && gameResults && (
				<>
					<EnhancedResults gameResults={gameResults} />

					<div className="mt-8 flex justify-center">
						<Button onClick={handleBackToHome} variant="secondary">
							Voltar ao Lobby
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default JoinRoom;
