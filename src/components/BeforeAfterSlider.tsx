import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for animation and smooth lerping
  const renderedPositionRef = useRef(50);
  const animationFrameId = useRef<number | null>(null);
  const lastInteractionTime = useRef<number>(0);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    if (!rectRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    renderedPositionRef.current = percent;
    setSliderPosition(percent);
    lastInteractionTime.current = Date.now();
  };

  const startDrag = (clientX: number) => {
    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    setIsDragging(true);
    handleMove(clientX);
  };

  const endDrag = () => {
    setIsDragging(false);
    rectRef.current = null;
    lastInteractionTime.current = Date.now();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  // Animation loop for oscillation and lerp
  useEffect(() => {
    const updateSlider = () => {
      const now = Date.now();
      const idleTime = now - lastInteractionTime.current;

      if (!isDragging) {
        const time = now / 1000; // in seconds
        // Soft sine wave oscillation between 45% and 55%
        const autoTarget = 50 + Math.sin(time * 1.5) * 6;

        // If the user just released the slider, smoothly interpolate (lerp) to the auto target position
        // Factor 0.06 is chosen for ultra-smooth springiness
        const lerpFactor = idleTime < 1000 ? 0.03 : 0.06;
        renderedPositionRef.current += (autoTarget - renderedPositionRef.current) * lerpFactor;
        
        setSliderPosition(renderedPositionRef.current);
      }

      animationFrameId.current = requestAnimationFrame(updateSlider);
    };

    animationFrameId.current = requestAnimationFrame(updateSlider);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-3xl overflow-hidden cursor-ew-resize select-none border border-white/10 group shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onMouseMove={onMouseMove}
      onTouchEnd={endDrag}
      onTouchMove={onTouchMove}
      onMouseDown={(e) => startDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <img src={afterImage} alt="Après les travaux" className="w-full h-full object-cover" draggable={false} />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#d1d1c4] shadow-lg border border-white/5 font-mono">Après</div>
      </div>

      {/* Before Image (Foreground/Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt="Avant les travaux" className="absolute inset-0 w-full h-full object-cover max-w-none" draggable={false} />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/70 shadow-lg border border-white/5 font-mono">Avant</div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 md:w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] text-black group-hover:scale-110 transition-transform">
          <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </div>
      </div>
    </div>
  );
}
