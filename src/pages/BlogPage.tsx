import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingMobileCta from '../components/FloatingMobileCta';
import { BookOpen, Clock, ArrowRight, Search } from 'lucide-react';
import { useBlogPosts } from '../hooks/useBlogPosts';

export default function BlogPage() {
  const { posts } = useBlogPosts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const categories = ['Tous', 'Rénovation & Conseils', 'Isolation & Acoustique', 'Geste Artisanal'];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Tous' || post.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-6 md:px-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(245,158,11,0.1)_0%,_transparent_70%)] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Breadcrumb & Top Badge */}
          <div className="mb-8 flex items-center space-x-2 text-xs font-mono text-white/50">
            <Link to="/" className="hover:text-amber-400 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-amber-400">Conseils & Blog Technique</span>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Savoir-Faire Artisanal • Bassin d'Arcachon</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Conseils Techniques & Guides Plâtrerie
            </h1>

            <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
              Découvrez nos articles pratiques rédigés par votre artisan sur le Bassin d'Arcachon : méthodes de réparation après dégât des eaux, isolation phonique des maisons bois et secrets de finition des bandes.
            </p>
          </div>

          {/* Search & Categories bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Articles Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-white/50 text-sm font-mono">Aucun article ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-3xl overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                      
                      <span className="absolute top-4 left-4 text-[10px] uppercase font-mono tracking-wider text-amber-300 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30">
                        {post.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                      <div className="flex items-center space-x-3 text-[10px] text-white/40 font-mono mb-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{post.readingTime}</span>
                        </span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>

                      <h2 className="text-xl font-light text-white group-hover:text-amber-200 transition-colors mb-3 leading-snug">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      <p className="text-xs text-white/60 leading-relaxed font-light line-clamp-3 mb-6">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
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
          )}

        </div>
      </main>

      <FloatingMobileCta />
      <Footer />
    </>
  );
}
