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

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    if (!rectRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
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
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-3xl overflow-hidden cursor-ew-resize select-none border border-white/10 group"
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
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/90 shadow-lg">Après</div>
      </div>

      {/* Before Image (Foreground/Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt="Avant les travaux" className="absolute inset-0 w-full h-full object-cover max-w-none" draggable={false} />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/90 shadow-lg">Avant</div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 md:w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] text-black group-hover:scale-110 transition-transform">
          <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-[#d1d1c4]" />
        </div>
      </div>
    </div>
  );
}
