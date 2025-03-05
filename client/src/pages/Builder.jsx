import React, { useState, useRef, useEffect } from "react";

import {
	PlusCircle,
	SquarePen,
	Check,
	ArrowLeft,
	ImagePlus,
	ChevronRight,
	X,
	Trash2,
    CheckCircle2,
} from "lucide-react";

const optionColors = ["#E21B3C", "#1368CE", "#FFA602", "#26890C"];

const Builder = ({ setCurrentPage, selectedQuiz, setSelectedQuiz, refreshQuizzes }) => {
    const [title, setTitle] = useState(selectedQuiz ? selectedQuiz.quiz.title : "Quiz Sem Nome");
    const [questions, setQuestions] = useState(
        selectedQuiz ? selectedQuiz.quiz.questions.map(q => ({
            ...q,
            correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : null
        })) : []
    );
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [openedQuestions, setOpenedQuestions] = useState([]);

	const fileInputRef = useRef(null);
	const titleInputRef = useRef(null);

	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, [isEditingTitle]);

	const handleTitleEdit = () => {
		setIsEditingTitle(true);
	};

	const saveTitleEdit = () => {
		setIsEditingTitle(false);
		if (!title.trim()) {
			setTitle("Quiz Sem Nome");
		}
	};

	const addNewBlankQuestion = () => {
		// Determinar o número da nova pergunta
		const questionNumber = questions.length + 1;

		setQuestions((questions) => [
			...questions,
			{
				title: `Nova pergunta #${questionNumber}`,
				options: [],
                correctOptionIndex: null,
			},
		]);

		setOpenedQuestions((openedQuestions) => [
			...openedQuestions,
			questions.length,
		]);
	};

	const addBlankOption = (questionIndex) => {
		if (questions[questionIndex].options.length >= 4) {
			return;
		}

		setQuestions((questions) => {
			let newQuestions = [...questions];

			// Determinar o número da nova opção
			const optionNumber = newQuestions[questionIndex].options.length + 1;

			// Criar a nova opção com nome sequencial
			newQuestions[questionIndex].options.push({
				text: `Nova opção #${optionNumber}`,
				image: null,
			});

			return newQuestions;
		});
	};

	// Nova função para lidar com o upload de imagem
	const handleImageUpload = (questionIndex, optionIndex, file) => {
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				// Criar um canvas para redimensionar a imagem
				const canvas = document.createElement("canvas");

				// Calcular as dimensões mantendo a proporção
				let width = img.width;
				let height = img.height;

				// Redimensionar se maior que 500px em qualquer dimensão
				if (width > 500 || height > 500) {
					if (width > height) {
						height = Math.round(height * (500 / width));
						width = 500;
					} else {
						width = Math.round(width * (500 / height));
						height = 500;
					}
				}

				// Configurar o canvas com as novas dimensões
				canvas.width = width;
				canvas.height = height;

				// Desenhar a imagem redimensionada no canvas
				const ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0, width, height);

				// Converter para base64
				const base64Image = canvas.toDataURL("image/jpeg", 0.85);

				// Atualizar o estado com a imagem base64
				setQuestions((prevQuestions) => {
					const newQuestions = [...prevQuestions];
					newQuestions[questionIndex].options[optionIndex].image =
						base64Image;
					return newQuestions;
				});
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	};

	// Função para remover a imagem
	const removeImage = (questionIndex, optionIndex) => {
		setQuestions((prevQuestions) => {
			const newQuestions = [...prevQuestions];
			newQuestions[questionIndex].options[optionIndex].image = null;
			return newQuestions;
		});
	};

	// Função para remover a opção
	const removeOption = (questionIndex, optionIndex) => {
		setQuestions((prevQuestions) => {
			const newQuestions = [...prevQuestions];
            // Se a opção sendo removida era a correta, resetar o índice
            if (newQuestions[questionIndex].correctOptionIndex === optionIndex) {
                newQuestions[questionIndex].correctOptionIndex = null;
            } else if (newQuestions[questionIndex].correctOptionIndex > optionIndex) {
                // Se a opção correta vem depois da removida, ajustar o índice
                newQuestions[questionIndex].correctOptionIndex--;
            }
			newQuestions[questionIndex].options.splice(optionIndex, 1);
			return newQuestions;
		});
	};

	// Função para marcar uma opção como correta
    const markAsCorrect = (questionIndex, optionIndex) => {
        setQuestions((prevQuestions) => {
            const newQuestions = [...prevQuestions];
            newQuestions[questionIndex].correctOptionIndex = optionIndex;
            return newQuestions;
        });
    };

	let allQuestionsHaveOptions = questions.every(
		(question) => question.options.length >= 2
	);

	let anyOptionWithSameNameOnSameQuestion = questions.some((question) => {
		let optionNames = question.options.map((option) => option.text);
		let uniqueOptionNames = new Set(optionNames);
		return optionNames.length !== uniqueOptionNames.size;
	});

	let anyQuestionWithReapeatedNames = questions.some((question, i) => {
		let questionNames = questions.map((q) => q.title);
		let uniqueQuestionNames = new Set(questionNames);
		return questionNames.length !== uniqueQuestionNames.size;
	});

    // Verificar se todas as questões têm uma opção correta selecionada
    let allQuestionsHaveCorrectOption = questions.every(
        question => question.options.length > 0 && question.correctOptionIndex !== null
    );

	let canSave =
		title.trim() &&
		questions.length > 0 &&
		allQuestionsHaveOptions &&
		!anyOptionWithSameNameOnSameQuestion &&
		!anyQuestionWithReapeatedNames &&
        allQuestionsHaveCorrectOption;

	const saveQuiz = () => {
		if (!canSave) return;

		// Pegar os quizzes existentes
		let quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];

		// Se for uma edição, atualizar o quiz existente
		if (selectedQuiz) {
			quizzes[selectedQuiz.index] = { title, questions };
		} else {
			// Caso contrário, adicionar um novo quiz
			quizzes.push({ title, questions });
		}

		localStorage.setItem("quizzes", JSON.stringify(quizzes));

		// Limpar a seleção
		if (setSelectedQuiz) setSelectedQuiz(null);

		// Atualizar a lista de quizzes
		refreshQuizzes();
		setCurrentPage(null);
	};

	return (
		<div className="w-full max-w-5xl mx-auto min-h-screen py-16 flex flex-col gap-6">
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<button
						onClick={() => setCurrentPage(null)}
						className="h-8 w-8 rounded-full transition group hover:bg-white/10 flex items-center justify-center cursor-pointer"
					>
						<ArrowLeft
							size={18}
							className="group-hover:text-white/60 text-white/50 transition"
						/>
					</button>

					<div className="flex flex-col">
						<small className="text-xs text-white/50 uppercase font-semibold">
							Criar novo quiz
						</small>
						<div className="flex items-center gap-2">
							{isEditingTitle ? (
								<div className="flex items-center gap-2">
									<input
										ref={titleInputRef}
										type="text"
										value={title}
										onChange={(e) =>
											setTitle(e.target.value)
										}
										onBlur={saveTitleEdit}
										onKeyDown={(e) =>
											e.key === "Enter" && saveTitleEdit()
										}
										className="text-3xl text-white font-semibold bg-transparent border-b border-white/30 focus:border-white/60 outline-none"
									/>
									<button
										onClick={saveTitleEdit}
										className="h-8 w-8 rounded-full transition group hover:bg-white/10 flex items-center justify-center cursor-pointer"
									>
										<Check
											size={18}
											className="group-hover:text-white/60 text-white/50 transition"
										/>
									</button>
								</div>
							) : (
								<>
									<h1 className="text-3xl text-white font-semibold">
										{title}
									</h1>
									<button
										onClick={handleTitleEdit}
										className="h-8 w-8 rounded-full transition group hover:bg-white/10 flex items-center justify-center cursor-pointer"
									>
										<SquarePen
											size={18}
											className="group-hover:text-white/60 text-white/50 transition"
										/>
									</button>
								</>
							)}
						</div>
					</div>
				</div>
				<button
					onClick={addNewBlankQuestion}
					className="px-4 py-2 text-white bg-rose-500 rounded-md hover:bg-rose-600 transition cursor-pointer flex items-center text-sm"
				>
					<PlusCircle size={18} className="mr-1" />
					Nova pergunta
				</button>
			</div>

			{/* Input file escondido para upload */}
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: "none" }}
				accept="image/*"
				onChange={(e) => {
					// Os atributos data serão atualizados quando o botão de upload for clicado
					if (e.target.files?.[0]) {
						const questionIndex = parseInt(
							e.target.dataset.questionIndex
						);
						const optionIndex = parseInt(
							e.target.dataset.optionIndex
						);
						handleImageUpload(
							questionIndex,
							optionIndex,
							e.target.files[0]
						);
						e.target.value = ""; // Limpar o input
					}
				}}
			/>

			<div className="w-full h-full flex flex-col gap-2 overflow-y-auto">
				{questions.length === 0 ? (
					<span className="text-white/50 text-sm">
						Nenhuma pergunta adicionada
					</span>
				) : (
					questions.map((question, questionIndex) => (
						<div
							key={questionIndex}
							className="w-full bg-white/5 rounded-xl p-4 flex flex-col gap-4"
						>
							<div className="flex flex-col">
								<span className="text-xs text-white/50 uppercase font-semibold">
									Pergunta {questionIndex + 1}
								</span>
								<input
									type="text"
									value={question.title}
									onChange={(e) => {
										setQuestions((questions) => {
											let newQuestions = [...questions];
											newQuestions[questionIndex].title =
												e.target.value;
											return newQuestions;
										});
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter") e.target.blur();
									}}
									className="text-white font-semibold bg-transparent outline-none border-b border-white/0 focus:border-white/30 text-xl"
								/>
							</div>

							<div className="flex flex-col w-full">
								<div className="flex items-center gap-2">
									{openedQuestions.includes(questionIndex) ? (
										<button
											onClick={() =>
												setOpenedQuestions(
													openedQuestions.filter(
														(i) =>
															i !== questionIndex
													)
												)
											}
											className="h-8 w-8 rounded-full transition group hover:bg-white/10 flex items-center justify-center cursor-pointer"
										>
											<ChevronRight
												size={20}
												className="group-hover:text-white/75 text-white/60 transition rotate-90"
											/>
										</button>
									) : (
										<button
											onClick={() =>
												setOpenedQuestions([
													...openedQuestions,
													questionIndex,
												])
											}
											className="h-8 w-8 rounded-full transition group hover:bg-white/10 flex items-center justify-center cursor-pointer"
										>
											<ChevronRight
												size={20}
												className="group-hover:text-white/75 text-white/60 transition"
											/>
										</button>
									)}

									<span
										onClick={() => {
											openedQuestions.includes(
												questionIndex
											)
												? setOpenedQuestions(
														openedQuestions.filter(
															(i) =>
																i !==
																questionIndex
														)
												  )
												: setOpenedQuestions([
														...openedQuestions,
														questionIndex,
												  ]);
										}}
										className="text-xl text-white cursor-pointer"
									>
										Opções ({question.options?.length || 0}
										/4)
									</span>
								</div>

								<div
									className={`${
										openedQuestions.includes(questionIndex)
											? "h-60"
											: "h-0"
									} transition-all duration-500 overflow-hidden w-full mt-2`}
								>
									<div className="grid grid-cols-4 gap-2">
										{question.options?.map(
											(option, optionIndex) => (
												<div
													key={optionIndex}
													className="w-full h-60 rounded-xl overflow-hidden border-2 flex flex-col"
													style={{
														borderColor:
															optionColors[
																optionIndex
															],
													}}
												>
													<div className="flex-1 relative">
														{option.image ? (
															<>
																<div className="flex gap-2 items-center absolute top-2 right-2">
                                                                    {question.correctOptionIndex === optionIndex ? (
                                                                        <div className="z-10 bg-green-500 rounded-full p-1 cursor-pointer">
                                                                            <CheckCircle2 size={16} className="text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div 
                                                                            className="z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80 transition"
                                                                            onClick={() => markAsCorrect(questionIndex, optionIndex)}
                                                                            title="Marcar como correta"
                                                                        >
                                                                            <CheckCircle2 size={16} className="text-white/70" />
                                                                        </div>
                                                                    )}
																	<div
																		className="z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80 transition"
																		onClick={() =>
																			removeImage(
																				questionIndex,
																				optionIndex
																			)
																		}
																	>
																		<X
																			size={
																				16
																			}
																			className="text-white"
																		/>
																	</div>

																	<div
																		className="z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80 transition"
																		onClick={() =>
																			// remove option
																			removeOption(
																				questionIndex,
																				optionIndex
																			)
																		}
																	>
																		<Trash2
																			size={
																				16
																			}
																			className="text-white"
																		/>
																	</div>
																</div>
																<div
																	className="w-full h-full bg-center bg-cover flex items-center justify-center"
																	style={{
																		backgroundImage: `url(${option.image})`,
																	}}
																/>
															</>
														) : (
															<>
																<div className="flex gap-2 items-center absolute top-2 right-2">
                                                                    {question.correctOptionIndex === optionIndex ? (
                                                                        <div className="z-10 bg-green-500 rounded-full p-1 cursor-pointer">
                                                                            <CheckCircle2 size={16} className="text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div 
                                                                            className="z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80 transition"
                                                                            onClick={() => markAsCorrect(questionIndex, optionIndex)}
                                                                            title="Marcar como correta"
                                                                        >
                                                                            <CheckCircle2 size={16} className="text-white/70" />
                                                                        </div>
                                                                    )}
																	<div
																		className="z-[999] bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80 transition"
																		onClick={() =>
																			removeOption(
																				questionIndex,
																				optionIndex
																			)
																		}
																	>
																		<Trash2
																			size={
																				16
																			}
																			className="text-white"
																		/>
																	</div>
																</div>
																<div
																	className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition"
																	onClick={() => {
																		// Preparar o input file com os dados desta opção
																		fileInputRef.current.dataset.questionIndex =
																			questionIndex;
																		fileInputRef.current.dataset.optionIndex =
																			optionIndex;
																		fileInputRef.current.click();
																	}}
																>
																	<ImagePlus
																		size={
																			24
																		}
																		className="text-white/50"
																	/>
																	<span className="ml-2 text-white/50 text-sm">
																		Adicionar
																		imagem
																	</span>
																</div>
															</>
														)}
													</div>

													<div
														className="h-16 w-full flex items-center justify-center"
														style={{
															backgroundColor:
																optionColors[
																	optionIndex
																],
														}}
													>
														<input
															type="text"
															value={option.text}
															onChange={(e) => {
																setQuestions(
																	(
																		prevQuestions
																	) => {
																		let newQuestions =
																			[
																				...prevQuestions,
																			];
																		newQuestions[
																			questionIndex
																		].options[
																			optionIndex
																		].text =
																			e.target.value;
																		return newQuestions;
																	}
																);
															}}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	"Enter"
																)
																	e.target.blur();
															}}
															className="text-center text-white font-semibold bg-transparent outline-none border-b border-white/0 focus:border-white/30 w-full px-2"
														/>
													</div>
												</div>
											)
										)}

										{Array.from(
											{
												length:
													4 -
													(question.options?.length ||
														0),
											},
											(_, i) => (
												<button
													key={i}
													onClick={() =>
														addBlankOption(
															questionIndex
														)
													}
													className="w-full h-60 border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-white/50 rounded-xl hover:bg-white/5 transition cursor-pointer"
												>
													<PlusCircle size={24} />
													<span className="mt-2 text-sm">
														Nova opção
													</span>
												</button>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			<button
				onClick={saveQuiz}
				className={`${
					canSave ? "opacity-100" : "pointer-events-none opacity-50"
				} px-4 py-2 w-fit mx-auto text-white bg-rose-500 rounded-md hover:bg-rose-600 transition cursor-pointer`}
			>
				Salvar
			</button>
            {!allQuestionsHaveCorrectOption && questions.length > 0 && (
                <p className="text-rose-400 text-center text-sm">
                    Todas as perguntas devem ter uma opção marcada como correta.
                </p>
            )}
		</div>
	);
};

export default Builder;
