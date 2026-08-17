import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InterventionZone() {
  const [isExpanded, setIsExpanded] = useState(false);

  const towns = [
    { name: 'Le Teich', code: '33470', dist: '0 km (Siège)', tag: 'Base', slug: 'le-teich' },
    { name: 'Gujan-Mestras', code: '33470', dist: '~ 5 km', tag: 'Intervention', slug: 'gujan-mestras' },
    { name: 'Biganos', code: '33380', dist: '~ 6 km', tag: 'Intervention', slug: 'biganos' },
    { name: 'Audenge', code: '33980', dist: '~ 11 km', tag: 'Intervention', slug: 'audenge' },
    { name: 'La Teste-de-Buch', code: '33260', dist: '~ 12 km', tag: 'Intervention', slug: 'la-teste-de-buch' },
    { name: 'Mios', code: '33380', dist: '~ 13 km', tag: 'Intervention', slug: 'mios' },
    { name: 'Arcachon', code: '33120', dist: '~ 16 km', tag: 'Intervention', slug: 'arcachon' },
    { name: 'Lanton', code: '33138', dist: '~ 18 km', tag: 'Intervention', slug: 'lanton' },
    { name: 'Salles', code: '33770', dist: '~ 20 km', tag: 'Intervention', slug: 'salles' },
  ];

  return (
    <section id="zone-intervention" className="py-16 md:py-24 px-6 md:px-12 border-t border-white/5 bg-[#080808] relative overflow-hidden">
      {/* Radial glow around Le Teich */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] md:text-xs font-mono uppercase tracking-widest mb-4">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Rayon de 20 km Maximum</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-light text-white mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Zone d'Intervention de Proximité
          </h2>

          <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
            Afin de garantir un service réactif, un suivi quotidien méticuleux et des déplacements optimisés, j'interviens exclusivement dans un <strong className="text-white font-normal">rayon de 20 km autour du Teich (33470)</strong> sur le Bassin d'Arcachon.
          </p>
        </div>

        {/* Main Périmètre Card Container */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 block mb-1">
                Périmètre d'action
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl md:text-5xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>20</span>
                <span className="text-lg font-light text-white/60">km autour du Teich</span>
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full border border-amber-500/30 text-xs font-mono font-semibold self-start md:self-auto">
              <span>9 COMMUNES COUVERTES</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs text-white/80">
            <li className="flex items-start space-x-2 bg-white/5 p-3 rounded-xl border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Réactivité accrue</strong> : Déplacement rapide pour devis & chantiers</span>
            </li>
            <li className="flex items-start space-x-2 bg-white/5 p-3 rounded-xl border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Déplacement Gratuit</strong> sur l'ensemble du secteur</span>
            </li>
            <li className="flex items-start space-x-2 bg-white/5 p-3 rounded-xl border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Suivi Quotidien</strong> : Présence garantie sur site</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-white/60">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Siège social : 6 rue Jacques Beynel, 33470 Le Teich</span>
            </div>

            {/* Accordion Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-mono font-medium tracking-wide flex items-center justify-center space-x-2 transition-all group shrink-0"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Masquer la liste des villes' : 'Voir les 9 communes couvertes'}</span>
              <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Accordion Expandable Grid */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-6 mt-6 border-t border-white/10">
                  <span className="block text-[11px] font-mono text-white/50 uppercase tracking-widest mb-4 text-center sm:text-left">
                    Sélectionnez votre commune pour votre devis dédié :
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {towns.map((town, idx) => (
                      <Link
                        key={idx}
                        to={`/artisan-plaquiste/${town.slug}`}
                        className="group p-3.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {town.dist}
                          </span>
                          <MapPin className="w-3.5 h-3.5 text-white/30 group-hover:text-amber-400 transition-colors" />
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
                            {town.name}
                          </h3>
                          <span className="text-[10px] text-white/40">{town.code}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
}
