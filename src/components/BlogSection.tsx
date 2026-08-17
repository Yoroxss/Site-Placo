import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { useBlogPosts } from '../hooks/useBlogPosts';

export default function BlogSection() {
  const { posts } = useBlogPosts();
  const displayPosts = posts.slice(0, 3);

  return (
    <section id="conseils" className="py-20 md:py-28 px-6 md:px-12 border-t border-white/5 bg-[#080808] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-[radial-gradient(circle,_rgba(245,158,11,0.1)_0%,_transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] md:text-xs font-mono uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Savoir-Faire & Conseils BTP</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-light text-white mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Guide Technique & Leçons du Bassin
            </h2>

            <p className="text-white/60 text-sm max-w-2xl font-light leading-relaxed">
              Des réponses précises et professionnelles aux problématiques réelles des logements du Bassin d'Arcachon : humidité, isolation phonique, rénovation en milieu occupé et finition des bandes.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-amber-400 hover:text-amber-300 font-mono group shrink-0"
          >
            <span>Tous nos articles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPosts.map((post, index) => (
            <article
              key={post.id}
              className={`group bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-3xl overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 ${
                index > 0 ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-white/5">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-mono">Image non disponible</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />
                  
                  <span className="absolute top-4 left-4 text-[10px] uppercase font-mono tracking-wider text-amber-300 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30">
                    {post.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center space-x-3 text-[10px] text-white/40 font-mono mb-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{post.readingTime}</span>
                    </span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>

                  <h3 className="text-lg md:text-xl font-light text-white group-hover:text-amber-200 transition-colors mb-3 leading-snug">
                    <Link to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-white/60 leading-relaxed font-light line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Read Link */}
              <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 group-hover:text-white transition-colors"
                >
                  <span>Lire l'article complet</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
