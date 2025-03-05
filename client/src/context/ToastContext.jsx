import React, { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid"; // Você precisará instalar: npm install uuid

// Criar o contexto
const ToastContext = createContext();

// Tipos de toast
export const TOAST_TYPES = {
	SUCCESS: "success",
	ERROR: "error",
	INFO: "info",
};

// Duração padrão (em milissegundos)
const DEFAULT_DURATION = 3000;

// Provedor de Toast
export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);

	// Função para adicionar um novo toast
	const addToast = useCallback(
		(message, type = TOAST_TYPES.INFO, duration = DEFAULT_DURATION) => {
			const id = uuidv4();
			const newToast = {
				id,
				message,
				type,
				duration,
			};

			setToasts((prevToasts) => [...prevToasts, newToast]);

			// Auto-remover após a duração especificada
			if (duration !== Infinity) {
				setTimeout(() => {
					removeToast(id);
				}, duration);
			}

			return id;
		},
		[]
	);

	// Função para remover um toast pelo ID
	const removeToast = useCallback((id) => {
		setToasts((prevToasts) =>
			prevToasts.filter((toast) => toast.id !== id)
		);
	}, []);

	// Funções de conveniência para diferentes tipos de toast
	const showSuccess = useCallback(
		(message, duration = DEFAULT_DURATION) => {
			return addToast(message, TOAST_TYPES.SUCCESS, duration);
		},
		[addToast]
	);

	const showError = useCallback(
		(message, duration = DEFAULT_DURATION) => {
			return addToast(message, TOAST_TYPES.ERROR, duration);
		},
		[addToast]
	);

	const showInfo = useCallback(
		(message, duration = DEFAULT_DURATION) => {
			return addToast(message, TOAST_TYPES.INFO, duration);
		},
		[addToast]
	);

	// Valor do contexto com todas as funções e estado
	const contextValue = {
		toasts,
		addToast,
		removeToast,
		showSuccess,
		showError,
		showInfo,
	};

	return (
		<ToastContext.Provider value={contextValue}>
			{children}
		</ToastContext.Provider>
	);
};

// Hook personalizado para usar o toast
export const useToast = () => {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast deve ser usado dentro de um ToastProvider");
	}

	return context;
};

export default ToastContext;
