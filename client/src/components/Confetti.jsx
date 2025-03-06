import React, { useEffect, useRef } from "react";

const Confetti = () => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const pieces = [];
		const colors = [
			"#ff577f",
			"#ff884b",
			"#ffd384",
			"#fff9b0",
			"#a3d9e9",
			"#7579e7",
		];
		const gravity = 0.2;
		const pieceCount = 200;

		// Criar os confetes
		for (let i = 0; i < pieceCount; i++) {
			pieces.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height - canvas.height,
				size: Math.random() * 12 + 5,
				color: colors[Math.floor(Math.random() * colors.length)],
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 2,
				speedX: (Math.random() - 0.5) * 5,
				speedY: Math.random() * 3 + 2,
				shape: Math.random() > 0.5 ? "rect" : "circle",
			});
		}

		// Animação
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			pieces.forEach((piece) => {
				// Mover o confete
				piece.x += piece.speedX;
				piece.y += piece.speedY;
				piece.speedY += gravity;
				piece.rotation += piece.rotationSpeed;

				// Desenhar o confete
				ctx.save();
				ctx.translate(piece.x, piece.y);
				ctx.rotate((piece.rotation * Math.PI) / 180);
				ctx.fillStyle = piece.color;

				if (piece.shape === "rect") {
					ctx.fillRect(
						-piece.size / 2,
						-piece.size / 4,
						piece.size,
						piece.size / 2
					);
				} else {
					ctx.beginPath();
					ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
					ctx.fill();
				}

				ctx.restore();

				// Reposicionar quando sair da tela
				if (piece.y > canvas.height + piece.size) {
					piece.y = -piece.size;
					piece.x = Math.random() * canvas.width;
				}
			});

			requestAnimationFrame(animate);
		};

		const animation = requestAnimationFrame(animate);

		// Limpar a animação quando o componente for desmontado
		return () => {
			cancelAnimationFrame(animation);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
		/>
	);
};

export default Confetti;
