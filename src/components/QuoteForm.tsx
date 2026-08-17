import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Send, Loader2 } from 'lucide-react';

export default function QuoteForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectType: 'Aménagement intérieur',
    message: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [geoLoading, setGeoLoading] = useState(false);

  const handleGeolocation = () => {
    setGeoLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          }));
          setGeoLoading(false);
        },
        (error) => {
          console.error(error);
          alert("Impossible de récupérer la position.");
          setGeoLoading(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const finalMessage = formData.location ? `${formData.message}\n\n[Localisation Client: ${formData.location}]` : formData.message;
      
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        projectType: formData.projectType,
        message: finalMessage,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'quotes'), payload);
      setStatus('success');
      setFormData({
        name: '', phone: '', email: '', projectType: 'Aménagement intérieur', message: '', location: ''
      });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
    setLoading(false);
  };


  return (
    <div className="bg-[#0a0a0a] rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 max-w-2xl mx-auto relative overflow-hidden backdrop-blur-xl" id="devis">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d1d1c4] rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2 opacity-10"></div>
      
      <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Obtenir un devis gratuit</h3>
      <p className="text-white/40 mb-8 text-xs uppercase tracking-widest">Basé au Teich, je me déplace sur tout le Bassin d'Arcachon.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[10px] uppercase tracking-widest text-white/50">Nom & Prénom</label>
            <input 
              id="name"
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-[10px] uppercase tracking-widest text-white/50">Téléphone</label>
            <input 
              id="phone"
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-white/50">Email</label>
          <input 
            id="email"
            type="email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="projectType" className="text-[10px] uppercase tracking-widest text-white/50">Type de projet</label>
          <select 
            id="projectType"
            value={formData.projectType}
            onChange={e => setFormData({...formData, projectType: e.target.value})}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 outline-none text-white focus:border-white/30 transition-all text-sm appearance-none cursor-pointer"
          >
            <option className="bg-[#111]">Aménagement intérieur (Cloisons, Faux-plafonds)</option>
            <option className="bg-[#111]">Plâtrerie Traditionnelle / Rénovation</option>
            <option className="bg-[#111]">Isolation thermique et acoustique</option>
            <option className="bg-[#111]">Dégâts des eaux</option>
            <option className="bg-[#111]">Autre</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="message" className="text-[10px] uppercase tracking-widest text-white/50">Message / Détails</label>
          <textarea 
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all resize-none text-sm"
          ></textarea>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="location" className="text-[10px] uppercase tracking-widest text-white/50">Localisation précise</label>
            <button 
              type="button" 
              onClick={handleGeolocation}
              disabled={geoLoading}
              className="text-[10px] uppercase tracking-widest text-[#d1d1c4] font-medium hover:text-white flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {geoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {geoLoading ? 'Localisation...' : 'Me géolocaliser'}
            </button>
          </div>
          <input 
            id="location"
            type="text" 
            readOnly
            value={formData.location}
            placeholder="Position (Optionnel)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none text-white/50 cursor-not-allowed text-sm"
          />
        </div>

        <button 
          type="submit"
          disabled={loading || status === 'success'}
          className="w-full bg-white text-black rounded-lg px-4 py-4 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#d1d1c4] disabled:opacity-50 transition-colors mt-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'success' ? (
            'Demande envoyée !'
          ) : (
            <>Envoyer la demande <Send className="w-3 h-3" /></>
          )}
        </button>

        {status === 'error' && (
          <p className="text-red-400 text-xs text-center uppercase tracking-widest">Une erreur est survenue. Veuillez réessayer.</p>
        )}
      </form>
    </div>
  );
}
