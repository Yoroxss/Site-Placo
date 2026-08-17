import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SeoConfig } from '../types';
import { DEFAULT_SEO_CONFIG } from '../data/defaultSeo';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useAdmin } from '../contexts/AdminContext';

export default function AiSeoDashboard() {
  const { adminCode } = useAdmin();
  const [config, setConfig] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'seo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as SeoConfig);
        }
      } catch (error) {
        console.error("Error fetching SEO config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'seo'), { ...config, adminCode });
      setFeedback({ message: 'Configuration SEO enregistrée avec succès !', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error saving SEO config:", error);
      setFeedback({ message: 'Erreur lors de la sauvegarde.', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => {
    setConfig({
      ...config,
      faqs: [...(config.faqs || []), { question: '', answer: '' }]
    });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...(config.faqs || [])];
    newFaqs[index][field] = value;
    setConfig({ ...config, faqs: newFaqs });
  };

  const removeFaq = (index: number) => {
    const newFaqs = [...(config.faqs || [])];
    newFaqs.splice(index, 1);
    setConfig({ ...config, faqs: newFaqs });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>;
  }

  return (
    <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-lg sm:text-xl tracking-widest uppercase text-[#d1d1c4] font-light mb-1 sm:mb-2">SEO & AI Agents (AEO)</h2>
          <p className="text-xs text-white/50">Gérez le référencement naturel et les instructions pour les IA génératives.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#d1d1c4] transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${feedback.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}
        >
          <span>{feedback.message}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column: Basic SEO */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-xs sm:text-sm tracking-widest uppercase text-white/70 border-b border-white/10 pb-2">Métadonnées Classiques</h3>
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Meta Title</label>
            <input
              type="text"
              value={config.metaTitle || ''}
              onChange={e => setConfig({ ...config, metaTitle: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2.5 outline-none text-white text-xs sm:text-sm focus:border-white/30 transition-colors"
              placeholder="Titre de la page (ex: Parat & Bouey | Plaquiste)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[10px] uppercase tracking-widest text-white/50">Meta Description</label>
              <span className={`text-[10px] ${(config.metaDescription?.length || 0) > 160 ? 'text-red-400' : 'text-white/30'}`}>
                {config.metaDescription?.length || 0} / 160
              </span>
            </div>
            <textarea
              value={config.metaDescription || ''}
              onChange={e => setConfig({ ...config, metaDescription: e.target.value })}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2.5 outline-none text-white text-xs sm:text-sm focus:border-white/30 transition-colors resize-none"
              placeholder="Description courte pour les résultats Google..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Mots-clés</label>
            <input
              type="text"
              value={config.keywords || ''}
              onChange={e => setConfig({ ...config, keywords: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2.5 outline-none text-white text-xs sm:text-sm focus:border-white/30 transition-colors"
              placeholder="Mot1, Mot2, Mot3..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Image Open Graph (URL)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={config.ogImage || ''}
                onChange={e => setConfig({ ...config, ogImage: e.target.value })}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3.5 py-2.5 outline-none text-white text-xs sm:text-sm focus:border-white/30 transition-colors"
                placeholder="https://..."
              />
              {config.ogImage && (
                <div className="w-14 h-10 sm:w-16 sm:h-12 rounded-lg border border-white/10 overflow-hidden bg-black/50 shrink-0">
                  <img src={config.ogImage} alt="OG Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AEO & FAQ */}
        <div className="space-y-6">
          <h3 className="text-sm tracking-widest uppercase text-white/70 border-b border-white/10 pb-2">Optimisation IA & FAQ</h3>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Instructions IA (AEO)</label>
            <textarea
              value={config.aiAgentInstructions || ''}
              onChange={e => setConfig({ ...config, aiAgentInstructions: e.target.value })}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none text-white text-sm focus:border-white/30 transition-colors resize-none"
              placeholder="Ex: Parat & Bouey est une entreprise artisanale spécialisée en plâtrerie sur le Bassin d'Arcachon..."
            />
            <p className="text-[10px] text-white/40 leading-relaxed">
              Ces instructions servent à "nourrir" les IA (ChatGPT, Perplexity, etc.) avec le contexte de l'entreprise : zone géographique, spécialités, ton de la marque. Elles seront injectées dans le schéma LocalBusiness de la page.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-white/50">FAQ Dynamique</label>
              <button
                onClick={addFaq}
                className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#d1d1c4] hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {(!config.faqs || config.faqs.length === 0) && (
                 <p className="text-xs text-white/30 text-center py-4 italic">Aucune question/réponse.</p>
              )}
              {config.faqs?.map((faq, index) => (
                <div key={index} className="bg-black/40 border border-white/10 p-4 rounded-xl relative group">
                  <button
                    onClick={() => removeFaq(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => updateFaq(index, 'question', e.target.value)}
                      placeholder="Question ?"
                      className="w-full bg-transparent border-b border-white/10 px-2 py-1 outline-none text-white text-sm focus:border-white/30 transition-colors"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => updateFaq(index, 'answer', e.target.value)}
                      placeholder="Réponse..."
                      rows={2}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none text-white/70 text-xs focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
