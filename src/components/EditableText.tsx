import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { Edit2, Check, X, Loader2 } from 'lucide-react';

interface EditableTextProps {
  contentKey: 'heroTitle' | 'heroSubtitle' | 'aboutText1' | 'aboutText2';
  value: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

export default function EditableText({ 
  contentKey, 
  value, 
  as: Component = 'p', 
  className = '', 
  style = {},
  multiline = false
}: EditableTextProps) {
  const { isAdmin, adminCode } = useAdmin();
  const { content, updateContent } = useSiteContent();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (currentValue !== value && adminCode) {
      setIsSaving(true);
      await updateContent({ ...content, [contentKey]: currentValue }, adminCode);
      setIsSaving(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return <Component className={className} style={style}>{value}</Component>;
  }

  if (isEditing) {
    return (
      <div className="relative group inline-block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className={`w-full bg-white/10 border border-white/30 rounded-lg p-2 text-white outline-none focus:border-[#d1d1c4] transition-all resize-y ${className}`}
            style={style}
            rows={5}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className={`w-full bg-white/10 border border-white/30 rounded-lg p-2 text-white outline-none focus:border-[#d1d1c4] transition-all ${className}`}
            style={style}
          />
        )}
        <div className="absolute -top-10 right-0 flex gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl z-50">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="p-1.5 bg-white/10 text-green-400 rounded-md hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1.5 bg-white/10 text-red-400 rounded-md hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group inline-block">
      <Component className={className} style={style}>{value}</Component>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-4 -right-4 p-2 bg-[#d1d1c4] text-black rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-50"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
}
