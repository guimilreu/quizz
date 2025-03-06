import React from "react";

const AnimatedQuestion = ({
	question,
	selectedOption,
	hasAnswered,
	onSelectOption,
	countdown,
}) => {
	return (
		<div className="flex flex-col gap-6 animate-in fade-in duration-500">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-white animate-in slide-in-from-left duration-300">
					{question.title}
				</h1>
			</div>

			{/* Grade de opções */}
			<div className="grid grid-cols-2 gap-4">
				{question.options.map((option, index) => (
					<button
						key={index}
						onClick={() => !hasAnswered && onSelectOption(index)}
						disabled={hasAnswered}
						className={`
              relative rounded-xl overflow-hidden border-2 h-48
              transform transition-all duration-300 
              ${
					hasAnswered
						? "opacity-60"
						: "hover:scale-[1.02] hover:shadow-lg"
				}
              ${selectedOption === index ? "ring-4 ring-white" : ""}
              animate-in fade-in slide-in-from-bottom duration-300 delay-${
					index * 100
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
							animationDelay: `${index * 100}ms`,
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
							<div className="absolute top-2 right-2 bg-white text-black font-bold text-sm p-1 px-2 rounded-full animate-in zoom-in-95 duration-300">
								Sua resposta
							</div>
						)}
					</button>
				))}
			</div>
		</div>
	);
};

export default AnimatedQuestion;
