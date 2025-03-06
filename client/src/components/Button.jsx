import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
	children,
	onClick,
	disabled,
	loading = false,
	variant = "primary", // primary, secondary, outline
	size = "medium", // small, medium, large
	className = "",
	...props
}) => {
	// Variante de estilo
	const variantStyles = {
		primary: "bg-rose-500 hover:bg-rose-600 text-white",
		secondary: "bg-white/10 hover:bg-white/20 text-white",
		outline:
			"bg-transparent border border-white/30 hover:bg-white/10 text-white",
	};

	// Tamanho
	const sizeStyles = {
		small: "px-3 py-1 text-sm",
		medium: "px-4 py-2",
		large: "px-6 py-3 text-lg",
	};

	return (
		<button
			onClick={!loading && !disabled ? onClick : undefined}
			disabled={disabled || loading}
			className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-md font-medium transition-all duration-200
        flex items-center justify-center gap-2
        ${loading || disabled ? "opacity-70 cursor-not-allowed" : ""}
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-rose-500/50
        ${className}
      `}
			{...props}
		>
			{loading && <Loader2 size={16} className="animate-spin" />}
			{children}
		</button>
	);
};

export default Button;
