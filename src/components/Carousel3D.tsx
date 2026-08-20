import { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface Carousel3DProps {
  images: any[];
  onImageClick: (index: number) => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function Carousel3D({ images, onImageClick }: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!images || images.length === 0) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (!isInteracting) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 3500); // Rotate every 3.5 seconds
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInteracting, images.length]);

  const getOffset = (index: number) => {
    const length = images.length;
    let diff = index - activeIndex;
    if (diff > Math.floor(length / 2)) {
      diff -= length;
    } else if (diff < -Math.floor(length / 2)) {
      diff += length;
    }
    return diff;
  };

  return (
    <div 
      className="relative w-full h-[450px] md:h-[700px] flex items-center justify-center overflow-hidden [perspective:1000px]"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
    >
      
      {/* Navigation Buttons */}
      <div className="absolute inset-x-4 md:inset-x-12 top-1/2 -translate-y-1/2 flex justify-between z-50 pointer-events-none">
        <button 
          aria-label="Image précédente"
          onClick={(e) => { e.stopPropagation(); prevSlide(); setIsInteracting(true); setTimeout(() => setIsInteracting(false), 3000); }}
          className="p-3 md:p-4 rounded-full border border-white/10 bg-black/50 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md pointer-events-auto"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button 
          aria-label="Image suivante"
          onClick={(e) => { e.stopPropagation(); nextSlide(); setIsInteracting(true); setTimeout(() => setIsInteracting(false), 3000); }}
          className="p-3 md:p-4 rounded-full border border-white/10 bg-black/50 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md pointer-events-auto"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <div className="relative w-[150px] sm:w-[200px] md:w-full max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg aspect-[4/5] flex items-center justify-center">
        <AnimatePresence initial={false}>
          {images.map((image, idx) => {
            const offset = getOffset(idx);
            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);
            
            // Only render items that are close to the center to save performance
            if (absOffset > 3) return null;

            // Math for the Coverflow effect
            const x = offset * 65; // Horizontal spread (%)
            const scale = 1 - absOffset * 0.15; // Shrink as it goes further
            const zIndex = 100 - absOffset;
            const rotateY = offset * -25; // Rotate to face inward
            const opacity = absOffset >= 3 ? 0 : 1 - absOffset * 0.3;
            
            return (
              <motion.div
                key={image.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragStart={() => setIsInteracting(true)}
                onDragEnd={(e, { offset, velocity }) => {
                  setIsInteracting(false);
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    nextSlide();
                  } else if (swipe > swipeConfidenceThreshold) {
                    prevSlide();
                  }
                }}
                animate={{
                  x: `${x}%`,
                  scale,
                  zIndex,
                  rotateY,
                  opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 120, // Lower stiffness for smoother, slower movement
                  damping: 25,    // Damping to prevent too much bouncing
                  mass: 1.2,      // Slightly more mass to slow it down
                }}
                className={`absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-[#111] shadow-2xl ${isCenter ? 'cursor-pointer' : 'pointer-events-none'}`}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => {
                  if (isCenter) onImageClick(idx);
                }}
              >
                <img 
                  src={image.url || null} 
                  alt={image.alt} 
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60"></div>
                
                {isCenter && (
                  <button aria-label="Agrandir l'image" className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/10 opacity-0 md:opacity-100 hover:scale-110 transition-all">
                    <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}

                <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-8 transition-all duration-700 ${isCenter ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <h3 className="text-sm md:text-2xl font-medium text-white mb-0.5 md:mb-2 tracking-wide font-serif italic">{image.title}</h3>
                  <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-widest leading-relaxed line-clamp-2">
                    {image.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
