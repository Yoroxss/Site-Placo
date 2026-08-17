import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-8 right-8 z-50 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 shadow-2xl max-w-sm md:max-w-none"
        >
          <p className="text-[9px] uppercase tracking-widest opacity-80 md:max-w-[200px] text-center md:text-left leading-relaxed">
            Nous utilisons des cookies pour améliorer votre expérience. <Link to="/mentions-legales" className="underline hover:text-white transition-colors">Mentions Légales</Link>
          </p>
          <div className="flex space-x-4">
            <button
              onClick={accept}
              className="text-[9px] font-bold uppercase underline hover:text-white/80 transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={decline}
              className="text-[9px] font-bold uppercase hover:text-white/60 transition-colors"
            >
              Refuser
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
