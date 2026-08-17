import { useEffect, useState, useRef } from 'react';
import { SeoConfig } from '../types';
import { DEFAULT_SEO_CONFIG } from '../data/defaultSeo';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, HelpCircle, MessageSquare, MousePointer } from 'lucide-react';

export default function FaqSection() {
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(DEFAULT_SEO_CONFIG.faqs);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docSnap = await getDoc(doc(db, 'settings', 'seo'));
        if (!isCancelled && docSnap.exists()) {
          const data = docSnap.data() as SeoConfig;
          if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
            setFaqs(data.faqs.filter(f => f.question && f.question.trim().length > 0));
          }
        }
      } catch (err) {
        console.warn("Deferred FAQ load notice:", err);
      }
    }, 3200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);


  // Auto-play interval: switch question every 5 seconds when not hovered
  useEffect(() => {
    if (isHovered || !faqs || faqs.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % faqs.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, faqs]);

  // Native wheel listener on desktop only (window.innerWidth >= 768)
  useEffect(() => {
    const carouselEl = carouselRef.current;
    if (!carouselEl) return;

    const onNativeWheel = (e: WheelEvent) => {
      // Do not block scrolling on mobile / tablet screens
      if (window.innerWidth < 768) return;

      e.preventDefault(); // Stop page scrolling when scrolling on the FAQ wheel on desktop
      const now = Date.now();
      if (now - lastScrollTime.current < 220) return;

      if (Math.abs(e.deltaY) > 15) {
        if (e.deltaY > 0) {
          setActiveIndex((prev) => (prev + 1) % faqs.length);
        } else {
          setActiveIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
        }
        lastScrollTime.current = now;
      }
    };

    carouselEl.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      carouselEl.removeEventListener('wheel', onNativeWheel);
    };
  }, [faqs.length]);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % faqs.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
  };

  return (
    <section id="faq" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5 relative bg-[#070707] overflow-hidden select-none">
      {/* Background Ambient Glows & Dynamic Light Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-radial from-amber-500/10 via-[#d1d1c4]/5 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="absolute top-10 left-10 w-[300px] h-[250px] bg-radial from-white/5 via-transparent to-transparent blur-[90px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-radial from-amber-500/5 via-transparent to-transparent blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 text-[#d1d1c4] uppercase tracking-widest text-[10px] mb-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-inner"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="flex items-center gap-1.5 font-medium tracking-wider"><HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Manège FAQ 3D</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-light text-white mb-4" 
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Foire Aux Questions
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-white/60 max-w-xl mx-auto leading-relaxed flex items-center justify-center gap-2"
          >
            <span>Naviguez au clavier, avec la molette ou en cliquant sur les cartes</span>
            <MousePointer className="w-3.5 h-3.5 text-amber-400 hidden sm:inline-block animate-bounce" />
          </motion.p>
        </div>

        {/* 3D Vertical Wheel Carousel Container */}
        <div 
          ref={carouselRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative min-h-[460px] md:min-h-[520px] flex flex-col items-center justify-center py-4 perspective-[1000px]"
        >
          {/* Interactive Scrollbar Control (Mobile Left side, Desktop Right side) */}
          <div className="absolute left-0 md:left-auto md:-right-14 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 md:gap-2 bg-black/85 backdrop-blur-md p-1.5 md:p-2.5 rounded-2xl border border-amber-500/25 shadow-[0_0_25px_rgba(0,0,0,0.8)] h-64 md:h-72">
            <button
              onClick={handlePrev}
              type="button"
              className="text-amber-400/80 hover:text-amber-400 p-1 hover:scale-110 transition-transform cursor-pointer"
              title="Question précédente"
            >
              <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {/* Interactive Scroll Track */}
            <div 
              className="relative w-2 md:w-2.5 flex-1 bg-white/10 rounded-full flex flex-col justify-between items-center py-1.5 md:py-2 cursor-pointer border border-white/10 group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const ratio = Math.max(0, Math.min(1, clickY / rect.height));
                const targetIdx = Math.round(ratio * (faqs.length - 1));
                setActiveIndex(targetIdx);
              }}
            >
              {/* Animated Glowing Thumb Pill */}
              <motion.div
                className="absolute w-full rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                style={{
                  height: `${Math.max(16, 100 / faqs.length)}%`,
                }}
                animate={{
                  top: `${(activeIndex / Math.max(1, faqs.length - 1)) * (100 - (100 / faqs.length))}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
              />

              {/* Ticks for each Question */}
              {faqs.map((faq, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                    }}
                    type="button"
                    className="relative z-10 group/dot flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
                    title={`Question ${idx + 1}`}
                  >
                    <span 
                      className={`block rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'w-1.5 h-1.5 md:w-2 md:h-2 bg-black shadow-[0_0_6px_rgba(0,0,0,0.8)] scale-110' 
                          : 'w-1 h-1 md:w-1.5 md:h-1.5 bg-white/40 group-hover/dot:bg-amber-300 group-hover/dot:scale-125'
                      }`} 
                    />
                    {/* Tooltip showing question preview on desktop hover */}
                    <span className="hidden md:flex absolute right-7 opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 bg-black/95 text-amber-400 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-amber-500/30 whitespace-nowrap pointer-events-none shadow-xl items-center gap-1.5">
                      <span className="font-bold text-amber-300">{String(idx + 1).padStart(2, '0')}.</span>
                      <span className="text-white/90 max-w-[180px] truncate">{faq.question}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              type="button"
              className="text-amber-400/80 hover:text-amber-400 p-1 hover:scale-110 transition-transform cursor-pointer"
              title="Question suivante"
            >
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Cards Wheel Display */}
          <div className="w-full max-w-2xl relative my-10 md:my-16 py-2 flex flex-col items-center pl-11 md:pl-0">
            {faqs.map((faq, idx) => {
              // Calculate shortest modular distance from activeIndex
              let offset = idx - activeIndex;
              const total = faqs.length;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;

              // Display 2 items above and 2 items below active (5 total items)
              const isVisible = Math.abs(offset) <= 2;
              if (!isVisible) return null;

              const isCenter = offset === 0;

              // Slight overlap transform values relative to top/bottom edges of active center card
              const translateY = isCenter 
                ? 0 
                : offset === -1 
                  ? 14   // Slight overlap behind top edge of center card
                  : offset === -2 
                    ? -46 // Stacked slightly above card -1
                    : offset === 1 
                      ? -14  // Slight overlap behind bottom edge of center card
                      : 46;  // Stacked slightly below card 1

              const rotateX = offset * -14; // Subtle cylindrical 3D tilt
              const scale = isCenter ? 1 : Math.max(0.88, 1 - Math.abs(offset) * 0.06);
              const opacity = isCenter ? 1 : Math.max(0.65, 1 - Math.abs(offset) * 0.2);
              const zIndex = 20 - Math.abs(offset) * 5;

              const numberFormatted = String(idx + 1).padStart(2, '0');

              const isOuter = Math.abs(offset) === 2;

              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    y: translateY,
                    rotateX: rotateX,
                    scale: scale,
                    opacity: opacity,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                    mass: 0.8
                  }}
                  style={{
                    zIndex: zIndex,
                    position: isCenter ? 'relative' : 'absolute',
                    top: isCenter ? 'auto' : offset > 0 ? '100%' : 'auto',
                    bottom: isCenter ? 'auto' : offset < 0 ? '100%' : 'auto',
                    left: 0,
                    right: 0,
                    transformStyle: 'preserve-3d',
                  }}
                  className={`w-full group cursor-pointer rounded-2xl transition-all duration-500 overflow-hidden backdrop-blur-xl ${
                    isOuter ? 'hidden md:block' : ''
                  } ${
                    isCenter
                      ? 'bg-gradient-to-br from-amber-500/15 via-white/5 to-black/90 border-2 border-amber-400/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.25)]'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/50 shadow-lg'
                  }`}
                >
                  {/* Top Edge Gold Highlight */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-opacity duration-500 ${
                      isCenter ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                    }`} 
                  />

                  {/* Card Header Question */}
                  <div className="p-5 md:p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span 
                        className={`text-xs md:text-sm font-mono mt-0.5 transition-colors duration-300 ${
                          isCenter ? 'text-amber-400 font-bold' : 'text-white/30 group-hover:text-amber-300'
                        }`}
                      >
                        {numberFormatted}
                      </span>
                      <h3 className={`text-sm md:text-base font-medium transition-colors duration-300 leading-snug ${
                        isCenter ? 'text-white font-semibold' : 'text-white/80 group-hover:text-amber-100'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  {/* Active Answer Content */}
                  <AnimatePresence initial={false}>
                    {isCenter && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="px-5 pb-6 pl-13 md:pl-14 text-xs md:text-sm text-white/85 leading-relaxed border-t border-amber-400/20 pt-4 font-light">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA note */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <a
            href="#devis"
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-amber-300 transition-all py-2.5 px-5 rounded-full border border-white/10 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 backdrop-blur-md shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Vous avez une autre question ? Contactez-nous ou demandez un devis gratuit</span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}


