import { useState, useEffect, useCallback } from "react";

const useCountdown = (initialSeconds, onComplete) => {
	const [seconds, setSeconds] = useState(initialSeconds);
	const [isActive, setIsActive] = useState(true);

	const start = useCallback(
		(newTime = initialSeconds) => {
			setSeconds(newTime);
			setIsActive(true);
		},
		[initialSeconds]
	);

	const pause = useCallback(() => {
		setIsActive(false);
	}, []);

	const resume = useCallback(() => {
		setIsActive(true);
	}, []);

	const reset = useCallback(() => {
		setSeconds(initialSeconds);
		setIsActive(false);
	}, [initialSeconds]);

	useEffect(() => {
		let interval = null;

		if (isActive) {
			interval = setInterval(() => {
				setSeconds((seconds) => {
					if (seconds <= 1) {
						clearInterval(interval);
						setIsActive(false);
						if (onComplete) onComplete();
						return 0;
					}
					return seconds - 1;
				});
			}, 1000);
		} else if (!isActive && seconds !== 0) {
			clearInterval(interval);
		}

		return () => clearInterval(interval);
	}, [isActive, onComplete]);

	return {
		seconds,
		isActive,
		start,
		pause,
		resume,
		reset,
		percentageLeft: (seconds / initialSeconds) * 100,
	};
};

export default useCountdown;
