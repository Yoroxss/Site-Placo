import React, { useState, useRef } from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { BlogPost } from '../data/blogData';
import { resizeImage } from '../utils/imageUtils';
import { BookOpen, Edit2, Trash2, Plus, Upload, Check, Loader2, Image as ImageIcon, Sparkles, X, Wand2 } from 'lucide-react';

const PRESET_TOPICS = [
  "Rénovation d'un plafond après infiltration ou dégât des eaux",
  "Choisir entre laine de verre et laine de roche pour l'isolation phonique",
  "Étapes pour réaliser des bandes à joint parfaites sans surépaisseur",
  "Plaque de plâtre hydrofuge (placo vert) : conseils pour salle de bain",
  "Aménagement de combles perdus sur le Bassin d'Arcachon"
];

export default function BlogAdminSection() {
  const { posts, savePost, deletePost } = useBlogPosts();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [aiTopic, setAiTopic] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [formState, setFormState] = useState<{
    id: string;
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    readingTime: string;
    date: string;
    author: string;
    imageUrl: string;
    contentText: string;
  }>({
    id: '',
    slug: '',
    title: '',
    category: 'Rénovation & Conseils',
    excerpt: '',
    readingTime: '5 min de lecture',
    date: 'Août 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: '',
    contentText: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAi = async (topicToUse?: string) => {
    const promptTopic = topicToUse || aiTopic;
    if (!promptTopic || !promptTopic.trim()) {
      alert("Veuillez indiquer le sujet de l'article à générer.");
      return;
    }

    setGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-blog-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: promptTopic }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la génération de l'article avec l'IA.");
      }

      const data = await res.json();

      setFormState(prev => ({
        ...prev,
        title: data.title || prev.title,
        category: data.category || prev.category,
        excerpt: data.excerpt || prev.excerpt,
        contentText: data.contentText || prev.contentText,
        readingTime: data.readingTime || prev.readingTime,
        author: data.author || prev.author,
        slug: (data.title || prev.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
      }));

      setFeedback("✨ Article rédigé automatiquement par l'IA avec succès ! Vous pouvez maintenant le relire, ajouter une photo et l'enregistrer.");
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setAiError(err.message || "Erreur lors de la génération. Réessayez.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setAiTopic('');
    setAiError(null);
    setFormState({
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      readingTime: post.readingTime,
      date: post.date,
      author: post.author,
      imageUrl: post.imageUrl,
      contentText: post.content.join('\n\n')
    });
  };

  const startCreate = () => {
    const newId = 'post-' + Date.now();
    setIsCreating(true);
    setEditingPost(null);
    setAiTopic('');
    setAiError(null);
    setFormState({
      id: newId,
      slug: 'nouvel-article-' + Date.now(),
      title: '',
      category: 'Rénovation & Conseils',
      excerpt: '',
      readingTime: '5 min de lecture',
      date: 'Août 2026',
      author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
      imageUrl: '',
      contentText: ''
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const resizedBase64 = await resizeImage(file, 1600, 1200, 0.85);
      setFormState(prev => ({ ...prev, imageUrl: resizedBase64 }));
      setFeedback("Image importée et optimisée avec succès !");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Erreur lors de l'optimisation de l'image:", err);
      alert("Erreur lors de l'envoi de l'image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.excerpt) {
      alert("Veuillez remplir au moins le titre et le résumé de l'article.");
      return;
    }

    setSaving(true);
    const contentParagraphs = formState.contentText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    const slug = formState.slug || formState.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const postToSave: BlogPost = {
      id: formState.id,
      slug,
      title: formState.title,
      category: formState.category,
      excerpt: formState.excerpt,
      readingTime: formState.readingTime,
      date: formState.date,
      author: formState.author,
      imageUrl: formState.imageUrl,
      content: contentParagraphs.length > 0 ? contentParagraphs : [formState.excerpt]
    };

    const success = await savePost(postToSave);
    setSaving(false);

    if (success) {
      setFeedback("Article enregistré avec succès dans la base de données !");
      setTimeout(() => setFeedback(null), 4000);
      setEditingPost(null);
      setIsCreating(false);
    } else {
      alert("Erreur lors de la sauvegarde de l'article.");
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet article de blog ?")) {
      await deletePost(postId);
      if (editingPost?.id === postId) {
        setEditingPost(null);
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Articles & Conseils Techniques</span>
          </div>
          <h2 className="text-xl md:text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Gestion du Blog & Conseils Local
          </h2>
          <p className="text-xs text-white/50 font-light mt-1">
            Modifiez les photos, textes et conseils techniques diffusés sur le site et les pages de villes.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un article</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Editor Form Modal or Drawer */}
      {(editingPost || isCreating) && (
        <div className="mb-10 p-6 md:p-8 bg-black/60 rounded-3xl border border-amber-500/30 relative">
          <button
            onClick={() => { setEditingPost(null); setIsCreating(false); }}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white rounded-lg bg-white/5"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-light text-amber-300 mb-6 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isCreating ? 'Nouveau Conseil / Article' : `Modifier : ${formState.title}`}</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* AI Generator Box */}
            <div className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-black/40 rounded-2xl border border-amber-500/30 shadow-inner">
              <div className="flex items-center space-x-2 text-amber-300 font-mono text-xs uppercase mb-2">
                <Wand2 className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold">Générateur Automatique d'Article par IA</span>
              </div>
              <p className="text-xs text-white/70 mb-4 font-light leading-relaxed">
                Tapez le sujet de votre choix ou cliquez sur une suggestion ci-dessous. L'IA va rédiger le titre, le résumé, les conseils techniques et la structure complète de l'article pour vous !
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="De quoi doit parler l'article ? (ex: Traitement des moisissures sur placo à Arcachon)..."
                  className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateAi()}
                  disabled={generatingAi || !aiTopic.trim()}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {generatingAi ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Rédaction par l'IA...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Générer avec l'IA</>
                  )}
                </button>
              </div>

              {/* Preset suggestions */}
              <div className="mt-3">
                <span className="text-[10px] font-mono text-white/40 block mb-2">Idées d'articles rapides (cliquez pour générer) :</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={generatingAi}
                      onClick={() => {
                        setAiTopic(preset);
                        handleGenerateAi(preset);
                      }}
                      className="text-[11px] bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-white/80 hover:text-amber-200 px-3 py-1.5 rounded-lg transition-all text-left disabled:opacity-50 cursor-pointer"
                    >
                      ✨ {preset}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <p className="mt-3 text-xs text-red-400 font-mono bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  ⚠️ {aiError}
                </p>
              )}
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-white/60 mb-2">Titre de l'article *</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Ex: Que faire après un dégât des eaux sur un plafond..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-white/60 mb-2">Catégorie</label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Rénovation & Conseils">Rénovation & Conseils</option>
                  <option value="Isolation & Acoustique">Isolation & Acoustique</option>
                  <option value="Geste Artisanal">Geste Artisanal</option>
                  <option value="Réglementation & DTU">Réglementation & DTU</option>
                </select>
              </div>
            </div>

            {/* Image Upload & Preview */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <label className="block text-[10px] font-mono uppercase text-amber-300 mb-2 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Image Principale de l'Article</span>
              </label>

              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Image Preview Box */}
                <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden bg-black/50 border border-white/10 relative shrink-0">
                  {formState.imageUrl ? (
                    <img src={formState.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-[10px] font-mono p-4 text-center">
                      Aucune image sélectionnée
                    </div>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <span className="text-xs text-white/70 block mb-2 font-light">
                      Changer la photo (importer un fichier depuis votre téléphone ou ordinateur) :
                    </span>
                    
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
                      disabled={uploadingImage}
                      className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono flex items-center space-x-2 transition-all disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Compression en cours...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Importer une photo de votre appareil</>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">Ou coller l'URL d'une image web :</label>
                    <input
                      type="text"
                      value={formState.imageUrl}
                      onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/60 mb-2">Résumé court (Affiché sur les cartes)</label>
              <textarea
                rows={2}
                value={formState.excerpt}
                onChange={(e) => setFormState({ ...formState, excerpt: e.target.value })}
                placeholder="Brève introduction qui donne envie de lire le conseil..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Full Article Content */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/60 mb-2">
                Contenu complet de l'article (Un paragraphe par saut de ligne. Utilisez '### Titre' pour les sous-titres)
              </label>
              <textarea
                rows={10}
                value={formState.contentText}
                onChange={(e) => setFormState({ ...formState, contentText: e.target.value })}
                placeholder="Rédigez le texte complet ici..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-light focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Extra Metas (Reading Time, Date, Author) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1">Temps de lecture</label>
                <input
                  type="text"
                  value={formState.readingTime}
                  onChange={(e) => setFormState({ ...formState, readingTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1">Date d'affichage</label>
                <input
                  type="text"
                  value={formState.date}
                  onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1">Auteur</label>
                <input
                  type="text"
                  value={formState.author}
                  onChange={(e) => setFormState({ ...formState, author: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setEditingPost(null); setIsCreating(false); }}
                className="px-4 py-2.5 text-xs text-white/60 hover:text-white font-mono"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> enregistrement...</>
                ) : (
                  <><Check className="w-4 h-4" /> Enregistrer les modifications</>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Articles List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-5 bg-black/40 border border-white/10 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-all group"
          >
            <div>
              {/* Card Image Header */}
              <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-white/5">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-mono">
                    Sans photo
                  </div>
                )}
                <span className="absolute top-3 left-3 text-[9px] uppercase font-mono tracking-wider text-amber-300 bg-black/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                  {post.category}
                </span>
              </div>

              <h4 className="text-base font-light text-white group-hover:text-amber-200 transition-colors mb-2 leading-snug">
                {post.title}
              </h4>

              <p className="text-xs text-white/60 font-light line-clamp-2 mb-4 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
              <span className="text-[10px] text-white/40">{post.readingTime}</span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEdit(post)}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono flex items-center space-x-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Éditer image & texte</span>
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Supprimer l'article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
