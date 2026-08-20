import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, X, Send, UserCheck, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { DEFAULT_REVIEWS, ReviewItem } from '../data/defaultReviews';

export type { ReviewItem };

export default function ReviewsSection() {
  const { isAdmin } = useAdmin();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Form states
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [projectType, setProjectType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isCancelled = false;

    const setupListener = async () => {
      try {
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        
        if (isCancelled) return;

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewItem));
              setReviews(fetched);
            } else {
              setReviews(DEFAULT_REVIEWS);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Reviews live listener notice:', err);
            setReviews(DEFAULT_REVIEWS);
            setLoading(false);
          }
        );

        if (isCancelled) {
          unsub();
        } else {
          unsubscribe = unsub;
        }
      } catch (error) {
        console.warn('Firestore load notice:', error);
        setReviews(DEFAULT_REVIEWS);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    setSubmitting(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await addDoc(collection(db, 'reviews'), {
        author: author.trim(),
        city: city.trim() || 'Bassin d\'Arcachon',
        rating: Number(rating),
        projectType: projectType.trim() || 'Travaux de Plâtrerie',
        comment: comment.trim(),
        verified: true,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      });

      setSuccessMsg('Merci ! Votre avis a été enregistré avec succès.');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
        setAuthor('');
        setCity('');
        setComment('');
        setProjectType('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  return (
    <section id="avis" className="py-20 md:py-28 px-6 md:px-12 border-t border-white/5 bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="mb-4 inline-flex items-center space-x-2 text-amber-300 font-mono text-[10px] md:text-xs uppercase tracking-widest">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Avis Clients & Retours de Chantiers</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-light text-white mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Témoignages & Confiance
            </h2>

            <p className="text-white/60 text-sm max-w-xl font-light leading-relaxed">
              Consultez les retours de nos clients sur le Bassin d'Arcachon. La satisfaction de nos clients est notre plus belle carte de visite.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Admin shortcut if logged in */}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[11px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all"
                title="Accéder au panneau d'administration pour modifier ou supprimer les avis"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Gérer les avis (Admin)</span>
              </Link>
            )}

            {/* Rating badge */}
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center space-x-3 backdrop-blur-md">
              <span className="text-2xl font-bold text-white">5.0</span>
              <div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">Satisfaction Client</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Laisser un avis</span>
            </button>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((rev, idx) => {
            // Responsively hide cards beyond the limit when collapsed
            let visibilityClass = "flex";
            if (!isExpanded) {
              if (idx === 2) {
                visibilityClass = "hidden md:flex"; // Visible on PC, hidden on Mobile
              } else if (idx > 2) {
                visibilityClass = "hidden"; // Hidden everywhere
              }
            }

            return (
              <div
                key={rev.id || idx}
                className={`${visibilityClass} bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-3xl p-6 md:p-8 flex-col justify-between backdrop-blur-md transition-all duration-300 group`}
              >
                <div>
                  {/* Header card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <UserCheck className="w-3 h-3 shrink-0" />
                      <span>Vérifié</span>
                    </span>
                  </div>

                  {/* Comment text */}
                  <p className="text-white/80 text-xs md:text-sm leading-relaxed mb-6 font-light italic">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Author Footer */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs mt-auto w-full">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-amber-200 transition-colors">
                      {rev.author}
                    </h3>
                    <span className="text-[10px] text-amber-400/80 uppercase font-mono tracking-wider">
                      {rev.projectType} • {rev.city}
                    </span>
                  </div>

                  {rev.date && (
                    <span className="text-[10px] text-white/40 font-mono">
                      {rev.date}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* See More / See Less Toggle Button */}
        {displayReviews.length > 2 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 text-xs text-white uppercase tracking-wider font-semibold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <span>{isExpanded ? "Voir moins de témoignages" : `Voir tous les témoignages (${displayReviews.length})`}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        )}

      </div>

      {/* MODAL TO ADD REVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-light text-white mb-2" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Partagez votre avis
            </h3>
            <p className="text-xs text-white/50 mb-6 font-light">
              Votre retour d'expérience est précieux pour d'autres propriétaires du Bassin d'Arcachon.
            </p>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-sm flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Votre Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Jean D."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Ville *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Le Teich, Arcachon..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Note (sur 5)</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5 Très Bon)</option>
                      <option value={3}>⭐⭐⭐ (3/5 Moyen)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Type de projet réalisé</label>
                  <input
                    type="text"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    placeholder="Ex: Faux-plafond, Rénovation salon..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Votre commentaire *</label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Racontez votre expérience..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Publication...' : 'Publier mon avis'}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
}
