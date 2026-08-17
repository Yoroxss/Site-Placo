import React, { useState, useEffect } from 'react';
import { Phone, FileText, ChevronDown, ChevronUp, MessageSquare, X, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function FloatingMobileCta() {
  const [collapsedMobile, setCollapsedMobile] = useState(false);
  const [collapsedDesktop, setCollapsedDesktop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Detect scroll to show/enhance floating widget
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 200);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDevisClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('devis');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    } else {
      navigate('/#devis');
      setTimeout(() => {
        const el = document.getElementById('devis');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <>
      {/* ----------------- MOBILE VERSION (< md) ----------------- */}
      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden pointer-events-auto">
        <div className="bg-[#0f0f0f]/95 border border-amber-500/30 rounded-xl p-2 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.85)] transition-all duration-300">
          {/* Toggle Bar for collapsing */}
          <div className="flex items-center justify-between px-1.5 pb-1 border-b border-white/5 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono uppercase tracking-tight text-amber-200/90 font-medium">
                Disponible • Bassin d'Arcachon
              </span>
            </div>
            <button 
              onClick={() => setCollapsedMobile(!collapsedMobile)}
              className="text-white/40 hover:text-white p-0.5"
              aria-label="Réduire ou agrandir la barre d'action"
            >
              {collapsedMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Buttons */}
          {!collapsedMobile && (
            <div className="grid grid-cols-2 gap-1.5">
              <a 
                href="tel:+33672159399"
                className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-[10px] py-1.5 px-2 rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide"
              >
                <Phone className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Appeler</span>
              </a>

              <a 
                href="#devis"
                onClick={handleDevisClick}
                className="flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-[10px] py-1.5 px-2 rounded-lg shadow-md active:scale-95 transition-all uppercase tracking-wide"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Devis gratuit</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- DESKTOP / PC VERSION (>= md) ----------------- */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50 pointer-events-auto">
        {collapsedDesktop ? (
          /* Minimized Floating Button on PC */
          <button
            onClick={() => setCollapsedDesktop(false)}
            className="group flex items-center space-x-3 bg-[#0a0a0a]/95 hover:bg-black border border-amber-500/40 hover:border-amber-400 p-3 pl-4 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-amber-200 uppercase tracking-wider">
                Devis & Contact Rapide
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold shadow-md group-hover:rotate-12 transition-transform">
              <Phone className="w-4 h-4 fill-current" />
            </div>
          </button>
        ) : (
          /* Expanded Floating Widget on PC */
          <div className="w-80 bg-[#0f0f0f]/95 border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300 animate-fade-in relative">
            
            {/* Close / Minimize button */}
            <button
              onClick={() => setCollapsedDesktop(true)}
              className="absolute top-3.5 right-3.5 text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Réduire le volet de contact"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Badge */}
            <div className="flex items-center space-x-2 mb-3 pr-6">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                Parat & Bouey • Artisans Plâtriers
              </span>
            </div>

            <p className="text-xs text-white/80 font-light mb-4 leading-relaxed">
              Une question ou un projet sur le Bassin d'Arcachon ? Contactez Yoni directement ou demandez votre devis sous 48h.
            </p>

            {/* Main CTAs */}
            <div className="space-y-2.5 mb-4">
              {/* Phone Button */}
              <a
                href="tel:+33672159399"
                className="w-full flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs py-3 px-4 rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all uppercase tracking-wider group"
              >
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 fill-current shrink-0 group-hover:rotate-12 transition-transform" />
                  <span>06 72 15 93 99</span>
                </div>
                <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded text-black/80">Appel direct</span>
              </a>

              {/* Devis Button */}
              <a
                href="#devis"
                onClick={handleDevisClick}
                className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider group"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Demander un devis</span>
                </div>
                <span className="text-[10px] font-mono text-amber-300">Gratuit</span>
              </a>
            </div>

            {/* Footer / Reassurance */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Le Teich + 20km</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Garantie Décennale</span>
              </span>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
