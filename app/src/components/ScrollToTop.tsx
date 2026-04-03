import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // Si il y a un hash (ancre), ne pas scroller
    if (hash) {
      return;
    }

    // Fonction pour scroller vers le haut
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    };

    // Scroller immédiatement
    scrollToTop();

    // Aussi scroller après un court délai pour s'assurer que le DOM est prêt
    const timer1 = setTimeout(scrollToTop, 0);
    const timer2 = setTimeout(scrollToTop, 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, key, hash]);

  return null;
};
