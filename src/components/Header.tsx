import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { trackUserAction } from '../utils/visitorTracker';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setSubmenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSubmenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setSubmenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const navigateToSection = (sectionId: string) => {
    setSubmenuOpen(false);
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
  };

  const scrollToContact = () => {
    trackUserAction('clic_devis_header');
    navigateToSection('devis');
  };

  const handlePhoneClick = () => {
    trackUserAction('appel_telephonique', '06 72 15 93 99');
  };

  const isSubmenuActive =
    location.pathname === '/chantier-propre-anti-poussiere' ||
    location.pathname.startsWith('/blog');

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0a]/85 backdrop-blur-md border-b border-white/10 py-5'
            : 'bg-transparent py-7 border-b border-white/10 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex flex-col group shrink-0">
            <span className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-white group-hover:text-white/80 transition-colors whitespace-nowrap">
              Parat & Bouey
            </span>
            <span className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/50 -mt-1 whitespace-nowrap">
              Artisanat d'Excellence
            </span>
          </Link>

          {/* Desktop Navigation (Clean & single-line, zero overflow) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] uppercase tracking-widest text-white/70">
            <button
              type="button"
              onClick={() => navigateToSection('services')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase tracking-widest"
            >
              Services
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('realisations')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase tracking-widest"
            >
              Réalisations
            </button>

            {/* Dropdown Submenu: Savoir-faire (Engagements, Outillage, Conseils & Blog) */}
            <div
              ref={submenuRef}
              className="relative"
              onMouseEnter={() => setSubmenuOpen(true)}
              onMouseLeave={() => setSubmenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setSubmenuOpen((prev) => !prev)}
                aria-expanded={submenuOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase tracking-widest ${
                  submenuOpen || isSubmenuActive
                    ? 'text-amber-300'
                    : 'hover:text-white'
                }`}
              >
                <span>Savoir-faire</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    submenuOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {submenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 top-full pt-3 z-50"
                  >
                    <div className="w-64 rounded-2xl bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => navigateToSection('engagement')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group cursor-pointer"
                      >
                        <span className="block text-[11px] uppercase tracking-widest text-white group-hover:text-amber-300 transition-colors">
                          Engagements
                        </span>
                        <span className="block text-[10px] normal-case tracking-normal text-white/45 mt-0.5 font-light">
                          Garantie décennale & finitions
                        </span>
                      </button>

                      <Link
                        to="/chantier-propre-anti-poussiere"
                        onClick={() => setSubmenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                      >
                        <span className="block text-[11px] uppercase tracking-widest text-white group-hover:text-amber-300 transition-colors">
                          Outillage & Matériel
                        </span>
                        <span className="block text-[10px] normal-case tracking-normal text-white/45 mt-0.5 font-light">
                          Mirka Leros, Makita & aspiration
                        </span>
                      </Link>

                      <div className="h-[1px] bg-white/10 my-0.5 mx-2" />

                      <Link
                        to="/blog"
                        onClick={() => setSubmenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                      >
                        <span className="block text-[11px] uppercase tracking-widest text-amber-400/90 group-hover:text-amber-300 transition-colors">
                          Conseils & Blog
                        </span>
                        <span className="block text-[10px] normal-case tracking-normal text-white/45 mt-0.5 font-light">
                          Guides pratiques & rénovations
                        </span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={scrollToContact}
              className="hover:text-amber-300 font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 uppercase tracking-widest"
            >
              Devis Gratuit
            </button>

            <a
              href="tel:0672159399"
              onClick={handlePhoneClick}
              className="flex items-center space-x-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors border border-white/20 whitespace-nowrap shrink-0"
            >
              <Phone className="w-3 h-3 shrink-0" />
              <span>06 72 15 93 99</span>
            </a>

            <Link
              to="/admin"
              className="flex items-center space-x-2 group whitespace-nowrap shrink-0"
            >
              <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-white transition-colors shrink-0"></div>
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">Admin</span>
            </Link>
          </nav>

          {/* Mobile / Tablet Quick Actions */}
          <div className="lg:hidden flex items-center space-x-3 shrink-0">
            <a
              href="tel:0672159399"
              onClick={handlePhoneClick}
              aria-label="Appeler Parat & Bouey"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              aria-label="Ouvrir le menu"
              className="text-white/70 hover:text-white transition-colors p-1 cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Fullscreen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col p-6 text-white overflow-y-auto"
          >
            <div className="flex justify-end">
              <button
                aria-label="Fermer le menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8 text-lg sm:text-xl font-light tracking-widest uppercase">
              <button
                type="button"
                onClick={() => navigateToSection('services')}
                className="hover:text-white/60 transition-colors uppercase tracking-widest cursor-pointer"
              >
                Services
              </button>

              <button
                type="button"
                onClick={() => navigateToSection('realisations')}
                className="hover:text-white/60 transition-colors uppercase tracking-widest cursor-pointer"
              >
                Réalisations
              </button>

              {/* Grouped Savoir-faire Submenu Items */}
              <div className="flex flex-col items-center gap-3.5 py-4 px-6 border-y border-white/10 w-full max-w-xs">
                <span className="text-[10px] font-mono text-amber-400/80 tracking-[0.25em]">
                  Savoir-faire
                </span>
                <button
                  type="button"
                  onClick={() => navigateToSection('engagement')}
                  className="text-sm text-white/80 hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
                >
                  Engagements
                </button>
                <Link
                  to="/chantier-propre-anti-poussiere"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Outillage & Matériel
                </Link>
                <Link
                  to="/blog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Conseils & Blog
                </Link>
              </div>

              <button
                type="button"
                onClick={scrollToContact}
                className="font-semibold text-white mt-2 hover:text-amber-300 transition-colors uppercase tracking-widest cursor-pointer"
              >
                Devis Gratuit
              </button>

              <a
                href="tel:0672159399"
                onClick={handlePhoneClick}
                className="flex items-center space-x-2 text-white bg-white/10 px-6 py-3 rounded-full border border-white/20 mt-1 whitespace-nowrap"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>06 72 15 93 99</span>
              </a>

              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-white/30 hover:text-white mt-6 transition-colors"
              >
                Admin
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
