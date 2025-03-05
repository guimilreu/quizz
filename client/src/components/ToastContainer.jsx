import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useToast, TOAST_TYPES } from "../context/ToastContext";

const ToastContainer = () => {
	const { toasts, removeToast } = useToast();

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					toast={toast}
					onClose={() => removeToast(toast.id)}
				/>
			))}
		</div>
	);
};

const Toast = ({ toast, onClose }) => {
	const { id, message, type, duration } = toast;

	// Auto-remover após a duração
	useEffect(() => {
		if (duration !== Infinity) {
			const timer = setTimeout(() => {
				onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	// Determinar ícone e cores com base no tipo
	const getToastStyles = () => {
		switch (type) {
			case TOAST_TYPES.SUCCESS:
				return {
					icon: <CheckCircle size={18} />,
					bgColor: "bg-green-500",
					textColor: "text-white",
					borderColor: "border-green-600",
					iconColor: "text-white",
				};
			case TOAST_TYPES.ERROR:
				return {
					icon: <XCircle size={18} />,
					bgColor: "bg-rose-500",
					textColor: "text-white",
					borderColor: "border-rose-600",
					iconColor: "text-white",
				};
			case TOAST_TYPES.INFO:
			default:
				return {
					icon: <Info size={18} />,
					bgColor: "bg-white/20",
					textColor: "text-white",
					borderColor: "border-white/30",
					iconColor: "text-white",
				};
		}
	};

	const styles = getToastStyles();

	// Animação de entrada e saída
	return (
		<div
			className={`
        flex items-center justify-between 
        ${styles.bgColor} ${styles.textColor} 
        backdrop-blur-sm rounded-lg shadow-lg 
        border-l-4 ${styles.borderColor}
        px-4 py-3 animate-in slide-in-from-right
      `}
			role="alert"
		>
			<div className="flex items-center">
				<span className={`${styles.iconColor} mr-2`}>
					{styles.icon}
				</span>
				<p className="text-sm font-medium">{message}</p>
			</div>
			<button
				onClick={onClose}
				className="ml-4 text-white hover:bg-white/10 rounded-full p-1 transition-colors"
			>
				<X size={16} />
			</button>
		</div>
	);
};

export default ToastContainer;
