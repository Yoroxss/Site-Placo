import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingMobileCta from '../components/FloatingMobileCta';
import QuoteForm from '../components/QuoteForm';
import { ArrowLeft, Clock, Calendar, UserCheck, ShieldCheck, Edit2, Upload, Loader2, Check, X, ImageIcon, Sparkles } from 'lucide-react';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useAdmin } from '../contexts/AdminContext';
import { resizeImage } from '../utils/imageUtils';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { posts, savePost } = useBlogPosts();
  const { isAdmin } = useAdmin();

  const post = posts.find((p) => p.slug === slug);

  // Quick edit modal state for admin
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editContentText, setEditContentText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (post) {
      setEditTitle(post.title);
      setEditExcerpt(post.excerpt);
      setEditImageUrl(post.imageUrl);
      setEditContentText(post.content.join('\n\n'));
    }
  }, [post]);

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a] text-white pt-40 pb-24 px-6 text-center">
          <h1 className="text-3xl font-light mb-4">Article non trouvé</h1>
          <p className="text-white/50 text-sm mb-8">L'article demandé n'existe pas ou a été déplacé.</p>
          <Link to="/blog" className="px-6 py-3 bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl">
            Retour aux articles
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resizedBase64 = await resizeImage(file, 1600, 1200, 0.85);
      setEditImageUrl(resizedBase64);
      setFeedback("Photo optimisée ! Cliquez sur 'Enregistrer' pour valider.");
    } catch (err) {
      console.error("Erreur lors de l'upload:", err);
      alert("Erreur lors du traitement de la photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const paragraphs = editContentText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    const updatedPost = {
      ...post,
      title: editTitle,
      excerpt: editExcerpt,
      imageUrl: editImageUrl,
      content: paragraphs.length > 0 ? paragraphs : post.content
    };

    const success = await savePost(updatedPost);
    setSaving(false);

    if (success) {
      setFeedback("Article et image mis à jour avec succès !");
      setTimeout(() => setFeedback(null), 3000);
      setIsEditing(false);
    } else {
      alert("Erreur lors de l'enregistrement.");
    }
  };

  // Schema.org BlogPosting
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": [post.imageUrl],
    "datePublished": "2026-08-01",
    "author": {
      "@type": "Person",
      "name": "Yoni Parat",
      "jobTitle": "Artisan Plâtrier-Jointeur",
      "worksFor": {
        "@type": "LocalBusiness",
        "name": "Parat & Bouey"
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "Parat & Bouey",
      "url": "https://www.plaquiste-arcachon.fr"
    }
  };

  return (
    <>
      <Header />

      {/* Schema.org Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-6 md:px-12 relative overflow-hidden">
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(245,158,11,0.1)_0%,_transparent_70%)] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          
          {/* Top Bar / Breadcrumb & Admin Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              to="/blog"
              className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à tous les conseils</span>
            </Link>

            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full font-mono flex items-center space-x-1.5 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Mode Admin : Éditer image / texte</span>
                </button>
              )}

              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                {post.category}
              </span>
            </div>
          </div>

          {feedback && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center space-x-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Quick Edit Modal for Admin */}
          {isEditing && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#121212] border border-amber-500/40 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative my-8">
                <button
                  onClick={() => setIsEditing(false)}
                  className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Édition Admin Directe</span>
                </div>

                <h3 className="text-xl font-light text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                  Modifier l'image et le texte de cet article
                </h3>

                <form onSubmit={handleQuickSave} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Titre de l'article</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Image edit */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <label className="block text-[10px] font-mono uppercase text-amber-300 mb-2 flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Changer la photo de l'article</span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-32 h-24 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                        {editImageUrl ? (
                          <img src={editImageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30">Aucune photo</div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3 w-full">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                        >
                          {uploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                          ) : (
                            <><Upload className="w-4 h-4" /> Importer une photo depuis mon appareil</>
                          )}
                        </button>

                        <input
                          type="text"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          placeholder="Ou coller une URL d'image..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Résumé (Excerpt)</label>
                    <textarea
                      rows={2}
                      value={editExcerpt}
                      onChange={(e) => setEditExcerpt(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Contenu texte (Paragraphes)</label>
                    <textarea
                      rows={8}
                      value={editContentText}
                      onChange={(e) => setEditContentText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-light leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs text-white/60 hover:text-white"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {post.title}
          </h1>

          {/* Meta Infos */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 font-mono pb-8 mb-8 border-b border-white/10">
            <div className="flex items-center space-x-2 text-amber-200">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>{post.author}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{post.readingTime}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{post.date}</span>
            </div>
          </div>

          {/* Hero Banner Image */}
          <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl group">
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/30 text-xs font-mono">
                Aucune image d'illustration
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />

            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 bg-black/80 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 text-xs font-mono px-3 py-1.5 rounded-xl backdrop-blur-md transition-all flex items-center space-x-1.5 shadow-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Changer cette photo</span>
              </button>
            )}
          </div>

          {/* Excerpt Box */}
          <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-amber-500/30 text-amber-200/90 text-sm md:text-base leading-relaxed italic mb-12 backdrop-blur-md">
            "{post.excerpt}"
          </div>

          {/* Article Body */}
          <article className="prose prose-invert max-w-none space-y-6 text-white/80 font-light text-sm md:text-base leading-relaxed">
            {post.content.map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-xl md:text-2xl font-light text-white pt-6 pb-2 border-b border-white/10" style={{ fontFamily: 'Georgia, serif' }}>
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              return (
                <p key={idx} className="text-white/80 leading-relaxed font-light">
                  {paragraph}
                </p>
              );
            })}
          </article>

          {/* Author Guarantee Card */}
          <div className="mt-16 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold shrink-0">
              YP
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-1">Un doute ou une question sur votre chantier ?</h4>
              <p className="text-xs text-white/60 font-light leading-relaxed mb-3">
                Basé à Le Teich, j'interviens gratuitement dans un rayon de 20 km (Arcachon, Gujan, Biganos, La Teste...) pour évaluer vos cloisons, plafonds ou réparations d'humidité.
              </p>
              <div className="flex items-center space-x-3 text-[10px] font-mono text-amber-300">
                <span className="flex items-center space-x-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Assurance Décennale Orus</span>
                <span>•</span>
                <span>Devis sous 48h</span>
              </div>
            </div>
          </div>

          {/* CTA Devis Section */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <QuoteForm />
          </div>

        </div>
      </main>

      <FloatingMobileCta />
      <Footer />
    </>
  );
}
