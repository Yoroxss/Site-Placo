import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  FileText,
  Calendar,
  MapPin,
  Newspaper,
  Play,
  X,
  ZoomIn
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingMobileCta from '../components/FloatingMobileCta';
import { useFeedPosts } from '../hooks/useFeedPosts';
import { FeedPost } from '../types/feedPost';

export default function ActualitesPage() {
  const { posts } = useFeedPosts();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string; caption: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.hash]);

  const categories = ['Tous', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts =
    selectedCategory === 'Tous'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Actualités Chantiers & Nouveautés | PARAT & BOUEY - Plâtrier Plaquiste',
    description:
      'Suivez les actualités chantiers, interventions récentes, finitions et équipements de PARAT & BOUEY, artisan plâtrier-plaquiste au Teich sur le Bassin d’Arcachon.',
    url: 'https://www.plaquiste-arcachon.fr/actualites',
    publisher: {
      '@type': 'LocalBusiness',
      name: 'PARAT - Plâtrier Plaquiste (Parat & Bouey)',
      telephone: '+33672159399',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '6 Rue Jacques Beynel',
        addressLocality: 'Le Teich',
        postalCode: '33470',
        addressCountry: 'FR'
      },
      url: 'https://www.plaquiste-arcachon.fr'
    },
    blogPost: posts.slice(0, 15).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.content.split('\n')[0].slice(0, 110),
      articleBody: p.content,
      datePublished: p.publishedAt,
      image: p.mediaType === 'image' && p.mediaUrl ? p.mediaUrl : undefined,
      author: {
        '@type': 'Person',
        name: 'Yohann Bouey'
      }
    }))
  };

  const renderPostCta = (post: FeedPost) => {
    if (post.ctaType === 'call') {
      return (
        <a
          href="tel:0672159399"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Appeler le 06 72 15 93 99</span>
        </a>
      );
    }

    if (post.ctaType === 'quote') {
      return (
        <Link
          to="/#devis"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Demander un devis</span>
        </Link>
      );
    }

    if (post.ctaType === 'learn_more') {
      const target = post.ctaUrl || '/#devis';
      const isExternal = target.startsWith('http');
      if (isExternal) {
        return (
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span>En savoir plus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        );
      }
      return (
        <Link
          to={target}
          className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
        >
          <span>En savoir plus</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>Actualités Chantiers & Nouveautés | Parat & Bouey - Bassin d'Arcachon</title>
        <meta
          name="description"
          content="Découvrez les dernières actualités chantiers, rénovations placo, finitions peinture et conseils de votre artisan plâtrier-plaquiste Parat & Bouey au Teich et sur le Bassin d'Arcachon."
        />
        <link rel="canonical" href="https://www.plaquiste-arcachon.fr/actualites" />
        <meta property="og:title" content="Actualités Chantiers & Nouveautés | Parat & Bouey" />
        <meta
          property="og:description"
          content="Publications récentes de nos chantiers en plâtrerie, bandes à joint, isolation et rénovation intérieure sur le Bassin d'Arcachon."
        />
        <meta property="og:url" content="https://www.plaquiste-arcachon.fr/actualites" />
        <meta property="og:type" content="blog" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <Header />

      <main className="flex-1 bg-[#0a0a0a] text-white pt-28 md:pt-36 pb-20 px-6 md:px-12 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/5 blur-[150px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="mb-4 inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono">
              <span className="w-8 h-[1px] bg-amber-400"></span>
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              <span>Actualités PARAT — Plâtrier Plaquiste</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 leading-tight"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Nouveautés &amp; Vie des Chantiers
            </h1>

            <p className="text-sm md:text-base text-white/65 max-w-2xl font-light leading-relaxed">
              Retrouvez ici le fil de nos interventions récentes, finitions et choix de matériaux professionnels sur le Bassin d’Arcachon (Le Teich, Gujan-Mestras, Biganos, La Teste-de-Buch, Arcachon).
            </p>
          </motion.div>

          {/* Filter Tabs */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-white/10">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feed Grid / Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {filteredPosts.map((post) => {
              const isHighlighted = location.hash === `#post-${post.id}`;

              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className={`bg-white/[0.03] border rounded-2xl md:rounded-3xl overflow-hidden flex flex-col justify-between backdrop-blur-sm transition-all duration-300 ${
                    isHighlighted
                      ? 'border-amber-400/60 shadow-2xl shadow-amber-500/10'
                      : 'border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div>
                    {/* Media (Image or Video) */}
                    {post.mediaType !== 'none' && post.mediaUrl && (
                      <div className="relative h-64 sm:h-72 bg-[#070707] overflow-hidden border-b border-white/10">
                        {post.mediaType === 'video' ? (
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            poster={post.videoPosterUrl || undefined}
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                          >
                            <source src={post.mediaUrl} type="video/mp4" />
                            Votre navigateur ne supporte pas la lecture vidéo.
                          </video>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomedImage({
                                url: post.mediaUrl || '',
                                alt: `Chantier ${post.location || 'Bassin d’Arcachon'} - ${post.dateLabel}`,
                                caption: `${post.dateLabel}${post.location ? ` · ${post.location}` : ''}`
                              })
                            }
                            className="group/img absolute inset-0 w-full h-full cursor-zoom-in block text-left"
                            aria-label="Agrandir la photo"
                          >
                            <img
                              src={post.mediaUrl}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 saturate-125 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center p-2.5">
                              <img
                                src={post.mediaUrl}
                                alt={`Chantier ${post.location || 'Bassin d’Arcachon'} - ${post.dateLabel}`}
                                loading="lazy"
                                className="relative z-10 max-w-full max-h-full object-contain rounded-lg drop-shadow-[0_8px_22px_rgba(0,0,0,0.75)] group-hover/img:scale-[1.02] transition-transform duration-300"
                              />
                            </div>
                            <span className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-black/70 border border-white/15 text-white/75 group-hover/img:text-amber-300 transition-colors">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        )}
                        {post.mediaType === 'video' && !post.videoPosterUrl && (
                          <div className="pointer-events-none absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/70 border border-white/15 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-amber-300" />
                            <span>Vidéo</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Body */}
                    <div className="p-6 md:p-7">
                      {/* Clean unboxed typographic metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-white/50 mb-4">
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Calendar className="w-3 h-3" />
                          <span>{post.dateLabel}</span>
                        </span>
                        {post.location && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-white/65">
                              <MapPin className="w-3 h-3 text-white/40" />
                              <span>{post.location}</span>
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{post.category}</span>
                      </div>

                      <p className="text-sm text-white/85 font-light leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  {post.ctaType !== 'none' && (
                    <div className="px-6 md:px-7 pb-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      {renderPostCta(post)}
                      <span className="text-[10px] font-mono text-white/35 uppercase tracking-wider">
                        Parat &amp; Bouey
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Bottom Conversion Banner */}
          <div className="mt-16 p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
            <h2
              className="text-2xl md:text-3xl font-light text-white mb-3"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Un projet de plâtrerie ou de rénovation ?
            </h2>
            <p className="text-xs md:text-sm text-white/60 font-light max-w-xl mx-auto mb-6 leading-relaxed">
              Basé au Teich, j'interviens sur l'ensemble du Bassin d'Arcachon pour étudier vos travaux et réaliser un devis détaillé gratuit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/#devis"
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-black text-xs uppercase tracking-wider font-bold hover:bg-amber-400 transition-all rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Demander un devis gratuit</span>
              </Link>
              <a
                href="tel:0672159399"
                className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs uppercase tracking-wider font-semibold transition-colors rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>06 72 15 93 99</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <FloatingMobileCta />
      <Footer />

      {/* Lightbox agrandissement photo */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setZoomedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu photo en grand"
        >
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            aria-label="Fermer l'aperçu"
            className="fixed top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black border border-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="max-w-5xl max-h-[85vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImage.url}
              alt={zoomedImage.alt}
              className="max-w-full max-h-[78vh] object-contain rounded-2xl border border-white/15 shadow-2xl"
            />
            <span className="text-xs font-mono text-amber-300">{zoomedImage.caption}</span>
          </div>
        </div>
      )}
    </>
  );
}
