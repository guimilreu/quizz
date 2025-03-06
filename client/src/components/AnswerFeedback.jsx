import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const AnswerFeedback = ({
	correctOptionIndex,
	selectedOption,
	questionResults,
}) => {
	// Verificar se a resposta do usuário está correta
	const isCorrect = selectedOption === correctOptionIndex;

	// Encontrar detalhes da resposta do usuário para mostrar pontuação
	const userResult = questionResults?.find(
		(result) => result.optionIndex === selectedOption
	);

	return (
		<div
			className={`
      fixed inset-0 flex items-center justify-center z-50 bg-black/70
      animate-in fade-in duration-300
    `}
		>
			<div
				className={`
        p-8 rounded-xl max-w-md w-full
        ${isCorrect ? "bg-green-500" : "bg-rose-500"}
        animate-in zoom-in-95 duration-300
      `}
			>
				<div className="flex flex-col items-center gap-4">
					{isCorrect ? (
						<>
							<CheckCircle size={64} className="text-white" />
							<h2 className="text-2xl font-bold text-white">
								Resposta Correta!
							</h2>
							{userResult && (
								<div className="text-white text-xl">
									+{userResult.points} pontos
								</div>
							)}
							<p className="text-white/90 text-center">
								Parabéns! Você escolheu a resposta certa.
							</p>
						</>
					) : (
						<>
							<XCircle size={64} className="text-white" />
							<h2 className="text-2xl font-bold text-white">
								Resposta Incorreta
							</h2>
							<p className="text-white/90 text-center">
								A resposta correta era a opção{" "}
								{correctOptionIndex + 1}.
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default AnswerFeedback;
