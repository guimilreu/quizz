import React, { useState, useEffect } from "react";
import { socket } from "@/lib/socket";
import { Edit, Play, Trash2 } from "lucide-react";

import { Pages } from "@/pages";
import GameRoom from "@/pages/GameRoom";
import JoinRoom from "@/pages/JoinRoom";

import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";

function App() {
	const [username, setUsername] = useState("");
	const [currentPage, setCurrentPage] = useState(null);
	const [userQuizzes, setUserQuizzes] = useState([]);
	const [selectedQuiz, setSelectedQuiz] = useState(null);

	let CurrentPageComponent = Pages[currentPage] || null;

	useEffect(() => {
		function generateRandomUsername() {
			// em portugues do brasil
			const adjectives = [
				"Rápido",
				"Inteligente",
				"Corajoso",
				"Divertido",
				"Esperto",
				"Carinhoso",
				"Amigável",
				"Engraçado",
				"Curioso",
				"Desastrado",
				"Corajoso",
			];

			const nouns = [
				"Cachorro",
				"Gato",
				"Coelho",
				"Leão",
				"Urso",
				"Peixe",
				"Tubarão",
				"Polvo",
				"Águia",
			];

			const randomAdjective =
				adjectives[Math.floor(Math.random() * adjectives.length)];
			const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

			return `${randomNoun} ${randomAdjective}`;
		}

		const savedUsername = localStorage.getItem("username");
		if (savedUsername) {
			setUsername(savedUsername);
		} else {
			const randomUsername = generateRandomUsername();
			setUsername(randomUsername);
			localStorage.setItem("username", randomUsername);
		}

		socket.on("connect", () => {
			console.log("Connected to server");
		});

		// Carregar os quizzes do localStorage
		const loadQuizzes = () => {
			const savedQuizzes =
				JSON.parse(localStorage.getItem("quizzes")) || [];
			console.log("Quizzes carregados:", savedQuizzes);
			setUserQuizzes(savedQuizzes);
		};

		loadQuizzes();

		// Adicionar um listener para mudanças no localStorage
		window.addEventListener("storage", loadQuizzes);

		return () => {
			window.removeEventListener("storage", loadQuizzes);
		};
	}, []);

	function refreshQuizzes() {
		const savedQuizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
		setUserQuizzes(savedQuizzes);
	}

	// Função para deletar um quiz
	const deleteQuiz = (index) => {
		const updatedQuizzes = [...userQuizzes];
		updatedQuizzes.splice(index, 1);
		localStorage.setItem("quizzes", JSON.stringify(updatedQuizzes));
		setUserQuizzes(updatedQuizzes);
	};

	// Função para editar um quiz
	const editQuiz = (quiz, index) => {
		setSelectedQuiz({ quiz, index });
		setCurrentPage("Builder");
	};

	// Função para criar uma sala com um quiz
	const createRoom = (quiz, index) => {
		setSelectedQuiz({ quiz, index });
		setCurrentPage("GameRoom");
	};

	return (
		<ToastProvider>
			<div className="flex flex-col gap-12 items-center justify-center min-h-screen fixed inset-0 bg-rose-950">
				{currentPage === null ? (
					<>
						<h1 className="text-5xl font-bold text-center text-white">
							Quizapp
						</h1>

						<div className="flex flex-col items-center justify-center">
							<small className="text-xs text-white/50 uppercase">
								Seu nome de usuário
							</small>
							<input
								type="text"
								value={username}
								onChange={(e) => {
									setUsername(e.target.value);
									localStorage.setItem(
										"username",
										e.target.value
									);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") e.target.blur();
								}}
								className="w-52 text-white text-center font-semibold bg-transparent outline-none border-b border-white/0 focus:border-white/30 transition hover:border-white/20 text-2xl"
							/>
						</div>

						<div className="flex items-center gap-4 h-fit">
							<button
								onClick={() => setCurrentPage("Builder")}
								className="px-4 py-2 text-white bg-rose-500 rounded-md hover:bg-rose-600 transition cursor-pointer"
							>
								Criar novo quiz
							</button>
							<div className="w-px h-3/5 bg-white/20"></div>
							<button
								onClick={() => setCurrentPage("JoinRoom")}
								className="px-4 py-2 text-white bg-rose-500 rounded-md hover:bg-rose-600 transition cursor-pointer"
							>
								Entrar em sala
							</button>
						</div>

						{/* Lista de Quizzes do Usuário */}
						{userQuizzes.length > 0 && (
							<div className="w-full max-w-2xl mt-6">
								<h2 className="text-xl text-white font-semibold mb-4">
									Seus Quizzes
								</h2>
								<div className="grid gap-3">
									{userQuizzes.map((quiz, index) => (
										<div
											key={index}
											className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
										>
											<div>
												<h3 className="text-white font-medium">
													{quiz.title}
												</h3>
												<p className="text-white/60 text-sm">
													{quiz.questions.length}{" "}
													perguntas
												</p>
											</div>
											<div className="flex gap-2 h-fit items-center">
												<button
													onClick={() =>
														createRoom(quiz, index)
													}
													className="group px-2.5 py-2 rounded-lg hover:bg-white/10 bg-white/5 transition flex gap-2 items-center text-xs text-white cursor-pointer"
													title="Criar sala"
												>
													<Play
														size={18}
														className="text-white/75 group-hover:text-white transition"
													/>
													Criar sala
												</button>

												<div className="w-px h-5 bg-white/20"></div>

												<button
													onClick={() =>
														editQuiz(quiz, index)
													}
													className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer group"
													title="Editar"
												>
													<Edit
														size={18}
														className="text-white/70 group-hover:text-white transition"
													/>
												</button>
												<button
													onClick={() =>
														deleteQuiz(index)
													}
													className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer group"
													title="Excluir"
												>
													<Trash2
														size={18}
														className="text-white/70 group-hover:text-white transition"
													/>
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				) : currentPage === "GameRoom" && selectedQuiz ? (
					<GameRoom
						quiz={selectedQuiz.quiz}
						setCurrentPage={setCurrentPage}
						username={username}
						refreshQuizzes={refreshQuizzes}
					/>
				) : currentPage === "JoinRoom" ? (
					<JoinRoom
						setCurrentPage={setCurrentPage}
						username={username}
					/>
				) : (
					<CurrentPageComponent
						setCurrentPage={setCurrentPage}
						selectedQuiz={selectedQuiz}
						setSelectedQuiz={setSelectedQuiz}
						refreshQuizzes={refreshQuizzes}
					/>
				)}

				{/* Componente de Toast */}
				<ToastContainer />
			</div>
		</ToastProvider>
	);
}

export default App;
