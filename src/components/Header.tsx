import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackUserAction } from '../utils/visitorTracker';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContact = () => {
    trackUserAction('clic_devis_header');
    const element = document.getElementById('devis');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handlePhoneClick = () => {
    trackUserAction('appel_telephonique', '06 72 15 93 99');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 py-6' : 'bg-transparent py-8 border-b border-white/10 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex flex-col group">
            <span className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-white group-hover:text-white/80 transition-colors">Parat & Bouey</span>
            <span className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/50 -mt-1">Artisanat d'Excellence</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-[11px] uppercase tracking-widest text-white/70">
            <a href="/#services" className="hover:text-white transition-colors">Services</a>
            <Link to="/#realisations" className="hover:text-white transition-colors">Réalisations</Link>
            <a href="/#engagement" className="hover:text-white transition-colors">Engagements</a>
            <Link to="/blog" className="hover:text-amber-300 text-amber-400 font-medium transition-colors">Conseils & Blog</Link>
            <button onClick={scrollToContact} className="hover:text-white font-semibold text-white transition-colors cursor-pointer">
              Devis Gratuit
            </button>
            <a 
              href="tel:0672159399" 
              onClick={handlePhoneClick}
              className="flex items-center space-x-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors border border-white/20"
            >
              <Phone className="w-3 h-3" />
              <span>06 72 15 93 99</span>
            </a>
            <Link to="/admin" className="flex items-center space-x-2 group ml-4">
              <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-white transition-colors"></div>
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">Admin</span>
            </Link>
          </nav>

          <div className="md:hidden flex items-center space-x-4">
            <a 
              href="tel:0672159399" 
              onClick={handlePhoneClick}
              aria-label="Appeler Parat & Bouey" 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button aria-label="Ouvrir le menu" className="text-white/70 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col p-6 text-white"
          >
            <div className="flex justify-end">
              <button aria-label="Fermer le menu" onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/70 hover:text-white">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 text-xl font-light tracking-widest uppercase">
              <a href="/#services" onClick={() => setMobileMenuOpen(false)} className="hover:text-white/50 transition-colors">Services</a>
              <Link to="/#realisations" onClick={() => setMobileMenuOpen(false)} className="hover:text-white/50 transition-colors">Réalisations</Link>
              <a href="/#engagement" onClick={() => setMobileMenuOpen(false)} className="hover:text-white/50 transition-colors">Engagements</a>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="text-amber-400 hover:text-amber-300 transition-colors">Conseils & Blog</Link>
              <button onClick={scrollToContact} className="font-semibold text-white mt-4 transition-colors">
                Devis Gratuit
              </button>
              <a 
                href="tel:0672159399" 
                onClick={handlePhoneClick}
                className="flex items-center space-x-2 text-white bg-white/10 px-6 py-3 rounded-full border border-white/20 mt-2"
              >
                <Phone className="w-4 h-4" />
                <span>06 72 15 93 99</span>
              </a>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-xs text-white/30 hover:text-white mt-8 transition-colors">Admin</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
