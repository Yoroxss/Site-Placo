import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal, MapPin, Tag } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

export interface BeforeAfterItem {
  id: string;
  title: string;
  description?: string;
  beforeUrl: string;
  afterUrl: string;
  altBefore?: string;
  altAfter?: string;
  tag?: string;
  location?: string;
  isFirst?: boolean;
  order?: number;
}

interface BeforeAfterSectionProps {
  items: BeforeAfterItem[];
}

export default function BeforeAfterSection({ items }: BeforeAfterSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'diapo' | 'grid'>('diapo');

  if (!items || items.length === 0) return null;

  const safeIndex = Math.min(Math.max(0, currentIndex), items.length - 1);
  const currentItem = items[safeIndex] || items[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="avant-apres" className="py-24 md:py-32 px-4 sm:px-6 md:px-12 border-t border-white/5 relative bg-[#050505]">
      {/* Decorative Atmosphere Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-10 md:mb-14">
          <div className="inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono mb-3">
            <span className="w-8 h-[1px] bg-amber-400"></span>
            <span>L'Évolution du Chantier</span>
            <span className="w-8 h-[1px] bg-amber-400"></span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-light text-white mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Transformations Avant / Après
          </h2>
          
          <p className="text-xs md:text-sm text-white/60 max-w-xl font-light leading-relaxed">
            Faites glisser le curseur pour mesurer la métamorphose de nos chantiers de rénovation, faux-plafonds et doublages sur le Bassin d'Arcachon.
          </p>

          {/* Toggle Diapo vs Voir Tous (when more than 1 item) */}
          {items.length > 1 && (
            <div className="mt-6 inline-flex items-center bg-white/5 border border-white/10 p-1 rounded-full text-xs backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode('diapo')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer text-xs font-medium ${
                  viewMode === 'diapo'
                    ? 'bg-amber-400 text-black shadow-md font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Diaporama</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer text-xs font-medium ${
                  viewMode === 'grid'
                    ? 'bg-amber-400 text-black shadow-md font-bold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Voir tout ({items.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODE 1: DIAPORAMA (1 à la fois, avec navigation & mini-sélecteur)
            ========================================================================= */}
        {viewMode === 'diapo' ? (
          <div className="relative">
            {/* Top Navigation Bar with Counter & Arrow Controls */}
            {items.length > 1 && (
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/10 border border-white/10 text-amber-300 rounded-full text-xs font-mono tracking-wider">
                    {safeIndex + 1} / {items.length}
                  </span>
                  {currentItem.tag && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono uppercase tracking-wider">
                      <Tag className="w-3 h-3 text-amber-400" />
                      {currentItem.tag}
                    </span>
                  )}
                  {currentItem.location && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/70 rounded-full text-[10px] font-mono">
                      <MapPin className="w-3 h-3 text-white/50" />
                      {currentItem.location}
                    </span>
                  )}
                </div>

                {/* Arrow Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Projet précédent"
                    className="p-2.5 rounded-full bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 text-white transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Projet suivant"
                    className="p-2.5 rounded-full bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 text-white transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Before/After Slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id || safeIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                {/* Title & Description */}
                <div className="text-center max-w-2xl px-4 mb-6">
                  <h3
                    className="text-2xl md:text-3xl lg:text-4xl font-light text-white mb-2 leading-snug"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    {currentItem.title}
                  </h3>
                  {currentItem.description && (
                    <p className="text-xs md:text-sm text-white/70 font-light leading-relaxed">
                      {currentItem.description}
                    </p>
                  )}
                </div>

                {/* The Slider */}
                <div className="w-full">
                  <BeforeAfterSlider
                    beforeImage={currentItem.beforeUrl}
                    afterImage={currentItem.afterUrl}
                    altBefore={currentItem.altBefore}
                    altAfter={currentItem.altAfter}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Thumbnail / Project Selector Strip (when more than 1 item) */}
            {items.length > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                {/* Dots indicator */}
                <div className="flex items-center gap-2">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Aller au projet ${idx + 1}`}
                      className={`h-2 transition-all rounded-full cursor-pointer ${
                        safeIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                {/* Mini Preview Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
                  {items.map((item, idx) => {
                    const isSelected = safeIndex === idx;
                    return (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-white/10 border-amber-400/60 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-black/30 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/10">
                          <img src={item.afterUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate max-w-[150px] sm:max-w-[190px] text-[11px] font-medium">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              MODE 2: GRILLE / TOUT AFFICHER (Voir Plus)
              ========================================================================= */
          <div className="space-y-16">
            {items.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="bg-black/40 border border-white/10 p-5 md:p-8 rounded-3xl backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 font-mono text-xs uppercase tracking-wider">
                        Projet 0{idx + 1}
                      </span>
                      {item.tag && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded text-[10px] font-mono">
                          {item.tag}
                        </span>
                      )}
                      {item.location && (
                        <span className="text-white/40 text-[10px] font-mono flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.location}
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-xl md:text-2xl font-light text-white"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setViewMode('diapo');
                    }}
                    className="self-start sm:self-auto text-xs text-amber-300 hover:text-amber-200 uppercase tracking-wider font-semibold border-b border-amber-400/40 pb-0.5 hover:border-amber-300 transition-colors cursor-pointer"
                  >
                    Ouvrir en diaporama →
                  </button>
                </div>

                {item.description && (
                  <p className="text-xs md:text-sm text-white/70 font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                )}

                <BeforeAfterSlider
                  beforeImage={item.beforeUrl}
                  afterImage={item.afterUrl}
                  altBefore={item.altBefore}
                  altAfter={item.altAfter}
                />
              </motion.div>
            ))}

            {/* Back to Slideshow button */}
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={() => setViewMode('diapo')}
                className="inline-flex items-center gap-2 bg-amber-400 text-black px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold hover:bg-amber-300 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Revenir au Diaporama</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
