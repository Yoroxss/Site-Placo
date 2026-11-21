import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Image as ImageIcon,
  Phone,
  FileText,
  Minus,
  Plus,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFeedPosts } from '../hooks/useFeedPosts';

type StripViewState = 'open' | 'collapsed' | 'closed';
const SESSION_VIEW_KEY = 'pb_home_news_view_state';

export default function HomeNewsStrip() {
  const { posts, sectionEnabled } = useFeedPosts();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewState, setViewState] = useState<StripViewState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_VIEW_KEY);
      if (saved === 'open' || saved === 'collapsed' || saved === 'closed') {
        return saved;
      }
    } catch {}
    return 'open';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_VIEW_KEY, viewState);
    } catch {}
  }, [viewState]);

  const carouselPosts = posts.slice(0, 3);
  const safeIndex = carouselPosts.length > 0 ? Math.min(activeIndex, carouselPosts.length - 1) : 0;

  useEffect(() => {
    if (carouselPosts.length > 0 && activeIndex >= carouselPosts.length) {
      setActiveIndex(0);
    }
  }, [carouselPosts.length, activeIndex]);

  if (!sectionEnabled || carouselPosts.length === 0 || viewState === 'closed') {
    return null;
  }

  const latestPost = carouselPosts[0];
  const activePost = carouselPosts[safeIndex];
  const recentOthers = posts.slice(1, 3);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % carouselPosts.length);
  };

  if (viewState === 'collapsed') {
    return (
      <section
        id="actualites-chantiers"
        aria-label="Dernières actualités chantiers (bandeau réduit)"
        className="py-3 px-6 md:px-12 border-y border-amber-500/15 bg-[#0a0a0a] bg-gradient-to-r from-amber-500/[0.05] via-amber-500/[0.07] to-amber-500/[0.03]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            to={`/actualites#post-${latestPost.id}`}
            className="flex items-center gap-3 min-w-0 group"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 shrink-0">
              En direct des chantiers
            </span>
            <span className="text-xs text-white/75 group-hover:text-amber-300 transition-colors truncate font-light">
              {latestPost.dateLabel} — {latestPost.content.replace(/\n+/g, ' ')}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewState('open')}
              aria-label="Afficher la section actualités"
              title="Déplier"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Afficher</span>
            </button>
            <button
              type="button"
              onClick={() => setViewState('closed')}
              aria-label="Fermer la section actualités"
              title="Fermer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="actualites-chantiers"
      aria-label="Dernières actualités chantiers"
      className="py-10 md:py-12 px-6 md:px-12 border-y border-amber-500/15 bg-[#0a0a0a] bg-gradient-to-r from-amber-500/[0.05] via-amber-500/[0.07] to-amber-500/[0.03] relative overflow-hidden"
    >
      {/* Halo ambiant orange/ambre très doux pour dissocier la section sans casser le thème sombre */}
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/3 w-[520px] h-[260px] bg-amber-500/[0.07] blur-[120px] rounded-full pointer-events-none"
      />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top bar: Eyebrow + Réduire (−) / Fermer (×) */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono">
            <span className="w-8 h-[1px] bg-amber-400"></span>
            <span>En direct des chantiers</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewState('collapsed')}
              aria-label="Réduire la section actualités"
              title="Réduire"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/55 hover:text-amber-300 cursor-pointer transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewState('closed')}
              aria-label="Fermer la section actualités"
              title="Fermer"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/55 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Editorial intro + 2 quick recent updates + link to /actualites */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            <div>
              <h2
                className="text-2xl md:text-3xl font-light text-white mb-3 leading-snug"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                Nouveautés &amp; Vie d'Atelier
              </h2>

              <p className="text-xs md:text-sm text-white/60 font-light leading-relaxed">
                Suivez nos chantiers récents, astuces de finition et matériels utilisés au quotidien sur le Bassin d'Arcachon.
              </p>
            </div>

            {recentOthers.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <span className="block text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  3 dernières publications
                </span>
                {carouselPosts.map((item, idx) => {
                  const isActive = idx === safeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`w-full text-left block group py-1.5 px-2.5 -mx-2.5 rounded-lg transition-colors cursor-pointer ${
                        isActive ? 'bg-amber-500/10 border border-amber-500/25' : 'hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400/85 mb-0.5">
                        <span>{item.dateLabel}</span>
                        {item.location && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-white/45 truncate">{item.location}</span>
                          </>
                        )}
                      </div>
                      <p
                        className={`text-xs transition-colors line-clamp-1 font-light ${
                          isActive ? 'text-amber-200' : 'text-white/75 group-hover:text-amber-300'
                        }`}
                      >
                        {item.content.replace(/\n+/g, ' ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-1">
              <Link
                to="/actualites"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 hover:text-amber-300 font-semibold transition-colors group"
              >
                <span>Voir toutes les actualités ({posts.length})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Featured Post Carousel Card (up to 3 latest posts) */}
          <div className="lg:col-span-8">
            <div className="group h-full bg-[#0a0a0a]/95 hover:bg-[#101010] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl md:rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 transition-all duration-300 shadow-2xl shadow-black/70">
              {/* Media Preview — clickable link to full post */}
              {activePost.mediaType !== 'none' && activePost.mediaUrl ? (
                <Link
                  to={`/actualites#post-${activePost.id}`}
                  aria-label={`Voir la publication du ${activePost.dateLabel}`}
                  className="sm:col-span-5 relative h-52 sm:h-auto sm:min-h-[230px] bg-[#070707] overflow-hidden border-b sm:border-b-0 sm:border-r border-white/10 block"
                >
                  {activePost.mediaType === 'video' ? (
                    <>
                      {activePost.videoPosterUrl ? (
                        <>
                          <img
                            src={activePost.videoPosterUrl}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 saturate-125 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <img
                              src={activePost.videoPosterUrl}
                              alt={`Vidéo chantier ${activePost.dateLabel}`}
                              loading="lazy"
                              className="relative z-10 max-w-full max-h-full object-contain rounded-lg drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)] group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,#050505_75%)] pointer-events-none"
                          />
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <video
                              key={activePost.id}
                              src={activePost.mediaUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="relative z-10 max-w-full max-h-full object-contain rounded-lg opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          </div>
                        </>
                      )}
                      <div className="absolute inset-0 z-20 bg-black/25 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/75 border border-amber-400/55 flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 ml-0.5 fill-amber-400" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={activePost.mediaUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 saturate-125 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <img
                          src={activePost.mediaUrl}
                          alt={`Actualité chantier ${activePost.dateLabel}`}
                          loading="lazy"
                          className="relative z-10 max-w-full max-h-full object-contain rounded-lg drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)] group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                    </>
                  )}
                </Link>
              ) : (
                <Link
                  to={`/actualites#post-${activePost.id}`}
                  aria-label={`Voir la publication du ${activePost.dateLabel}`}
                  className="sm:col-span-4 relative h-40 sm:h-auto sm:min-h-[160px] bg-gradient-to-br from-white/[0.04] to-black flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/10"
                >
                  <ImageIcon className="w-8 h-8 text-amber-400/40" />
                </Link>
              )}

              {/* Content Body */}
              <div
                className={`${
                  activePost.mediaType !== 'none' && activePost.mediaUrl
                    ? 'sm:col-span-7'
                    : 'sm:col-span-8'
                } p-6 md:p-8 flex flex-col justify-between gap-4`}
              >
                <Link to={`/actualites#post-${activePost.id}`} className="block">
                  {/* Clean unboxed metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/50 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-amber-400 font-medium">
                        {safeIndex === 0 ? 'Dernière publication' : 'Publication récente'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activePost.dateLabel}</span>
                      {activePost.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{activePost.location}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                      {activePost.category}
                    </span>
                  </div>

                  <p className="text-sm md:text-base text-white/90 font-light leading-relaxed whitespace-pre-line line-clamp-4 mb-2">
                    {activePost.content}
                  </p>
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                  <Link
                    to={`/actualites#post-${activePost.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    {activePost.ctaType === 'call' ? (
                      <>
                        <Phone className="w-3.5 h-3.5" />
                        <span>Lire &amp; appeler l'artisan</span>
                      </>
                    ) : activePost.ctaType === 'quote' ? (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Voir le post &amp; demander un devis</span>
                      </>
                    ) : (
                      <>
                        <span>Lire la publication complète</span>
                        <ArrowRight className="w-3.5 h-3.5 hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Link>

                  {carouselPosts.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Publication précédente"
                        title="Publication précédente"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/15 hover:border-amber-400/50 text-white/80 hover:text-amber-300 cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono text-white/60 tabular-nums px-1.5">
                        {safeIndex + 1} / {carouselPosts.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Publication suivante"
                        title="Publication suivante"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/15 hover:border-amber-400/50 text-white/80 hover:text-amber-300 cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
