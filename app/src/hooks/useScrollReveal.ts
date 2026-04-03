import { useEffect, useRef, useState } from 'react';

export const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    if (!ref.current) {
      setIsVisible(true);
      return;
    }

    let didReveal = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          didReveal = true;
          setIsVisible(true);
          // Stop observing after element is visible
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    observer.observe(ref.current);

    const fallbackId = window.setTimeout(() => {
      if (!didReveal) {
        setIsVisible(true);
      }
    }, 800);

    return () => {
      window.clearTimeout(fallbackId);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};
