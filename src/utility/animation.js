export const SlideUp = (delay) => {
	return {
		hidden: {
			opacity: 0,
			y: 50,
		},
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.4,
				delay: delay * 0.5, // Reduce delay proportionally
			},
		},
	};
};
export const SlideLeft = (delay) => {
	return {
		hidden: {
			opacity: 0,
			x: 50,
		},
		visible: {
			opacity: 1,
			x: 0,
			transition: {
				duration: 0.4,
				delay: delay * 0.5, // Reduce delay proportionally
			},
		},
	};
};
export const SlideRight = (delay) => {
	return {
		hidden: {
			opacity: 0,
			x: -50,
		},
		visible: {
			opacity: 1,
			x: 0,
			transition: {
				duration: 0.4,
				delay: delay * 0.5, // Reduce delay proportionally
			},
		},
	};
};

import { useEffect, useState, useRef } from 'react';

export function useInView() {
	const [isInView, setIsInView] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsInView(entry.isIntersecting);
			},
			{
				root: null,
				rootMargin: '0px',
				threshold: 0.1,
			},
		);

		const currentRef = ref.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, []);

	return { ref, isInView };
}

export function useTypewriter(text, speed = 50) {
	const [displayText, setDisplayText] = useState('');
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayText((prev) => prev + text[currentIndex]);
				setCurrentIndex((prev) => prev + 1);
			}, speed);

			return () => clearTimeout(timeout);
		} else {
			setIsComplete(true);
		}
	}, [currentIndex, text, speed]);

	return { displayText, isComplete };
}

export function useCountUp(end, duration = 2000, start = 0) {
	const [count, setCount] = useState(start);
	const { ref, isInView } = useInView();

	useEffect(() => {
		if (!isInView) return;

		let startTime;
		let animationFrame;

		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);
			const currentCount = Math.floor(progress * (end - start) + start);

			setCount(currentCount);

			if (progress < 1) {
				animationFrame = requestAnimationFrame(animate);
			}
		};

		animationFrame = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationFrame);
	}, [start, end, duration, isInView]);

	return { count, ref };
}
