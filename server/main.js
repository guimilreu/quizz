const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); // Para gerar códigos de sala

// Configuração do CORS para permitir conexões do cliente React
const io = new Server(server, {
	cors: {
		origin: "*", // URL do seu cliente React
		methods: ["GET", "POST"],
		allowedHeaders: ["Content-Type"],
		credentials: true,
	},
});

app.use(cors());
app.use(express.json());

// Rotas para servir arquivos estáticos
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

// Armazenamento em memória para as salas
const rooms = new Map();
const userConnections = new Map();

// Eventos Socket.io
io.on("connection", (socket) => {
	console.log(`Usuário conectado: ${socket.id}`);

	// Evento para criação de sala
	socket.on("create_room", (data) => {
		try {
			const { quiz, hostName } = data;

			// Gerar um código de sala de 6 caracteres em maiúsculo
			const roomCode = uuidv4().substring(0, 6).toUpperCase();

			// Armazenar informações da sala
			rooms.set(roomCode, {
				id: roomCode,
				quiz,
				host: {
					id: socket.id,
					name: hostName,
				},
				players: [],
				state: "waiting", // waiting, playing, results, finished
				currentQuestion: 0,
				startTime: null,
				answers: {},
				results: {},
			});

			// Associar o socket do usuário a esta sala como host
			userConnections.set(socket.id, {
				roomId: roomCode,
				isHost: true,
				name: hostName,
			});

			// Inscrever o host na sala
			socket.join(roomCode);

			// Enviar confirmação de criação da sala
			socket.emit("room_created", {
				roomId: roomCode,
				quiz,
			});

			console.log(`Sala criada: ${roomCode} pelo host: ${socket.id}`);
		} catch (error) {
			console.error("Erro ao criar sala:", error);
			socket.emit("error", { message: "Erro ao criar sala" });
		}
	});

	// Evento para jogador entrar na sala
	socket.on("join_room", (data) => {
		try {
			const { roomId, playerName } = data;

			// Verificar se a sala existe
			if (!rooms.has(roomId)) {
				socket.emit("error", { message: "Sala não encontrada" });
				return;
			}

			const room = rooms.get(roomId);

			// Verificar se a sala já começou
			if (room.state !== "waiting") {
				socket.emit("error", { message: "Esta partida já começou" });
				return;
			}

			// Verificar se o nome já está em uso
			if (room.players.some((player) => player.name === playerName)) {
				socket.emit("error", { message: "Este nome já está em uso" });
				return;
			}

			// Adicionar jogador à sala
			const player = {
				id: socket.id,
				name: playerName,
				score: 0,
				answers: [],
			};

			room.players.push(player);
			userConnections.set(socket.id, {
				roomId,
				isHost: false,
				name: playerName,
			});

			// Inscrever o jogador na sala
			socket.join(roomId);

			// Notificar o host e os jogadores sobre o novo participante
			io.to(roomId).emit("player_joined", {
				playerId: socket.id,
				playerName,
				players: room.players.map((p) => ({
					id: p.id,
					name: p.name,
					score: p.score,
				})),
			});

			// Enviar informações da sala para o jogador
			socket.emit("room_joined", {
				roomId,
				quizTitle: room.quiz.title,
				hostName: room.host.name,
				players: room.players.map((p) => ({
					id: p.id,
					name: p.name,
					score: p.score,
				})),
			});

			console.log(`Jogador ${playerName} entrou na sala ${roomId}`);
		} catch (error) {
			console.error("Erro ao entrar na sala:", error);
			socket.emit("error", { message: "Erro ao entrar na sala" });
		}
	});

	// Evento para iniciar o jogo
	socket.on("start_game", () => {
		try {
			const userInfo = userConnections.get(socket.id);

			if (!userInfo || !userInfo.isHost) {
				socket.emit("error", {
					message: "Apenas o host pode iniciar o jogo",
				});
				return;
			}

			const roomId = userInfo.roomId;
			if (!rooms.has(roomId)) {
				socket.emit("error", { message: "Sala não encontrada" });
				return;
			}

			const room = rooms.get(roomId);
			room.state = "playing";
			room.startTime = Date.now();
			room.currentQuestion = 0;
			room.answers = {};
			room.results = {};

			// Enviar a primeira pergunta para todos na sala
			sendQuestionToRoom(roomId);

			console.log(`Jogo iniciado na sala ${roomId}`);
		} catch (error) {
			console.error("Erro ao iniciar jogo:", error);
			socket.emit("error", { message: "Erro ao iniciar jogo" });
		}
	});

	// Receber resposta do jogador
	socket.on("submit_answer", (data) => {
		try {
			const { optionIndex } = data;
			const userInfo = userConnections.get(socket.id);

			if (!userInfo) {
				socket.emit("error", {
					message: "Usuário não está em uma sala",
				});
				return;
			}

			const roomId = userInfo.roomId;
			if (!rooms.has(roomId)) {
				socket.emit("error", { message: "Sala não encontrada" });
				return;
			}

			const room = rooms.get(roomId);
			if (room.state !== "playing") {
				socket.emit("error", { message: "Esta sala não está em jogo" });
				return;
			}

			// Registrar a resposta do jogador
			const timestamp = Date.now();
			if (!room.answers[room.currentQuestion]) {
				room.answers[room.currentQuestion] = [];
			}

			// Verificar se o jogador já respondeu esta pergunta
			const existingAnswer = room.answers[room.currentQuestion].find(
				(a) => a.playerId === socket.id
			);
			if (existingAnswer) {
				socket.emit("error", {
					message: "Você já respondeu esta pergunta",
				});
				return;
			}

			room.answers[room.currentQuestion].push({
				playerId: socket.id,
				playerName: userInfo.name,
				optionIndex,
				timestamp,
			});

			// Confirmar que a resposta foi recebida
			socket.emit("answer_confirmed");

			// Notificar o host que um jogador respondeu
			io.to(room.host.id).emit("player_answered", {
				playerId: socket.id,
				playerName: userInfo.name,
			});

			// Verificar se todos responderam para passar para a próxima pergunta
			const allAnswered = room.players.every((player) =>
				room.answers[room.currentQuestion]?.some(
					(answer) => answer.playerId === player.id
				)
			);

			if (allAnswered) {
				// Calcular resultados e preparar para próxima pergunta
				processAnswers(roomId);
			}

			console.log(
				`Jogador ${socket.id} respondeu à pergunta ${room.currentQuestion} na sala ${roomId}`
			);
		} catch (error) {
			console.error("Erro ao enviar resposta:", error);
			socket.emit("error", { message: "Erro ao enviar resposta" });
		}
	});

	// Host avança manualmente para a próxima pergunta
	socket.on("next_question", () => {
		try {
			const userInfo = userConnections.get(socket.id);

			if (!userInfo || !userInfo.isHost) {
				socket.emit("error", {
					message: "Apenas o host pode avançar a pergunta",
				});
				return;
			}

			const roomId = userInfo.roomId;
			if (!rooms.has(roomId)) {
				socket.emit("error", { message: "Sala não encontrada" });
				return;
			}

			const room = rooms.get(roomId);

			if (room.state === "playing") {
				// Se estamos no meio de uma pergunta, processo as respostas atuais
				processAnswers(roomId);
			} else if (room.state === "results") {
				// Se já mostramos os resultados, avançar para a próxima pergunta
				room.currentQuestion++;

				if (room.currentQuestion >= room.quiz.questions.length) {
					// Se acabaram as perguntas, encerrar o jogo
					endGame(roomId);
				} else {
					// Senão, enviar a próxima pergunta
					room.state = "playing";
					sendQuestionToRoom(roomId);
				}
			}

			console.log(`Host avançou para próxima pergunta na sala ${roomId}`);
		} catch (error) {
			console.error("Erro ao avançar pergunta:", error);
			socket.emit("error", {
				message: "Erro ao avançar para próxima pergunta",
			});
		}
	});

	// Desconexão do usuário
	socket.on("disconnect", () => {
		try {
			const userInfo = userConnections.get(socket.id);

			if (userInfo) {
				const { roomId, isHost } = userInfo;

				if (rooms.has(roomId)) {
					const room = rooms.get(roomId);

					if (isHost) {
						// Se o host saiu, encerrar a sala
						io.to(roomId).emit("room_closed", {
							message: "O host encerrou a sala",
						});

						// Limpar a sala
						rooms.delete(roomId);

						// Remover associações de socket para todos os jogadores
						room.players.forEach((player) => {
							userConnections.delete(player.id);
						});
					} else {
						// Remover o jogador da sala
						room.players = room.players.filter(
							(p) => p.id !== socket.id
						);

						// Notificar outros jogadores
						io.to(roomId).emit("player_left", {
							playerId: socket.id,
							players: room.players.map((p) => ({
								id: p.id,
								name: p.name,
								score: p.score,
							})),
						});
					}
				}

				// Remover a associação do socket
				userConnections.delete(socket.id);
			}

			console.log(`Usuário desconectado: ${socket.id}`);
		} catch (error) {
			console.error("Erro ao desconectar:", error);
		}
	});
});

// Funções auxiliares
function sendQuestionToRoom(roomId) {
	if (!rooms.has(roomId)) return;

	const room = rooms.get(roomId);
	if (room.currentQuestion >= room.quiz.questions.length) {
		// Fim do jogo
		endGame(roomId);
		return;
	}

	const question = room.quiz.questions[room.currentQuestion];

	// Preparar a pergunta para os jogadores (sem revelar a resposta correta)
	const questionForPlayers = {
		title: question.title,
		options: question.options.map((opt, index) => ({
			text: opt.text,
			image: opt.image,
			id: index,
		})),
	};

	io.to(roomId).emit("question", {
		questionData: questionForPlayers,
		totalQuestions: room.quiz.questions.length,
		questionNumber: room.currentQuestion + 1,
		timeLimit: 60, // Tempo em segundos para responder
	});
}

function processAnswers(roomId) {
	if (!rooms.has(roomId)) return;

	const room = rooms.get(roomId);

	// Mudar para o estado de resultados
	room.state = "results";

	// Calcular pontuações para a pergunta atual
	calculateScores(roomId);

	// Enviar resultados da pergunta atual
	sendQuestionResults(roomId);
}

function calculateScores(roomId) {
	if (!rooms.has(roomId)) return;

	const room = rooms.get(roomId);
	const questionIndex = room.currentQuestion;
	const currentQuestion = room.quiz.questions[questionIndex];

	// Na estrutura do quiz fornecida, o índice 0 é a resposta correta
	const correctAnswerIndex = 0;

	// Obter as respostas para esta pergunta
	const answers = room.answers[questionIndex] || [];

	// Ordenar por timestamp (quem respondeu primeiro)
	answers.sort((a, b) => a.timestamp - b.timestamp);

	// Array para armazenar os resultados
	if (!room.results[questionIndex]) {
		room.results[questionIndex] = [];
	}

	// Contagem de respostas corretas
	let correctAnswersCount = 0;

	// Calcular pontuações
	answers.forEach((answer) => {
		const player = room.players.find((p) => p.id === answer.playerId);
		if (!player) return;

		// Verificar se a resposta está correta
		const isCorrect = answer.optionIndex === correctAnswerIndex;
		let points = 0;

		if (isCorrect) {
			correctAnswersCount++;

			// Pontuação base por resposta correta
			points = 1000;

			// Bônus por rapidez (primeiros a responder corretamente ganham mais)
			if (correctAnswersCount === 1)
				points += 500; // Primeiro a responder corretamente
			else if (correctAnswersCount === 2) points += 300; // Segundo
			else if (correctAnswersCount === 3) points += 200; // Terceiro

			player.score += points;
		}

		// Registrar resultado
		room.results[questionIndex].push({
			playerId: answer.playerId,
			playerName: answer.playerName,
			optionIndex: answer.optionIndex,
			isCorrect,
			points: isCorrect ? points : 0,
		});
	});

	// Ordenar os jogadores por pontuação
	room.players.sort((a, b) => b.score - a.score);
}

function sendQuestionResults(roomId) {
	if (!rooms.has(roomId)) return;

	const room = rooms.get(roomId);
	const questionIndex = room.currentQuestion;
	const currentQuestion = room.quiz.questions[questionIndex];

	// Na estrutura do quiz fornecida, o índice 0 é a resposta correta
	const correctAnswerIndex = 0;

	io.to(roomId).emit("question_results", {
		questionNumber: questionIndex + 1,
		correctOptionIndex: correctAnswerIndex,
		correctOptionText: currentQuestion.options[correctAnswerIndex].text,
		playerResults: room.results[questionIndex] || [],
		playerScores: room.players
			.map((p) => ({
				id: p.id,
				name: p.name,
				score: p.score,
			}))
			.sort((a, b) => b.score - a.score), // Ordenar por pontuação
	});
}

function endGame(roomId) {
	if (!rooms.has(roomId)) return;

	const room = rooms.get(roomId);
	room.state = "finished";

	// Classificar jogadores por pontuação
	const rankedPlayers = [...room.players]
		.sort((a, b) => b.score - a.score)
		.map((player, index) => ({
			id: player.id,
			name: player.name,
			score: player.score,
			rank: index + 1,
		}));

	io.to(roomId).emit("game_over", {
		ranking: rankedPlayers,
		totalQuestions: room.quiz.questions.length,
	});

	console.log(`Jogo finalizado na sala ${roomId}`);

	// Manter a sala ativa por um tempo para que os jogadores vejam os resultados
	// e depois limpar
	setTimeout(() => {
		if (rooms.has(roomId)) {
			rooms.delete(roomId);
		}
	}, 60000); // Manter a sala por 1 minuto após o fim do jogo
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Servidor rodando em http://localhost:${PORT}`);
});
