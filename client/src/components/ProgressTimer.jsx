import React, { useEffect, useState } from "react";

const ProgressTimer = ({ totalTime, currentTime }) => {
	const [width, setWidth] = useState(100);

	useEffect(() => {
		const percentage = (currentTime / totalTime) * 100;
		setWidth(percentage);
	}, [currentTime, totalTime]);

	// Determinar a cor baseada no tempo restante
	const getColor = () => {
		if (width > 66) return "bg-green-500";
		if (width > 33) return "bg-yellow-500";
		return "bg-rose-500";
	};

	return (
		<div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
			<div
				className={`h-full ${getColor()} transition-all duration-1000 ease-linear`}
				style={{ width: `${width}%` }}
			/>
		</div>
	);
};

export default ProgressTimer;
