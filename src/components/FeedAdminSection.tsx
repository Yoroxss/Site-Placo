import React, { useState } from 'react';
import {
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  Check,
  Loader2,
  Video,
  Image as ImageIcon,
  ExternalLink,
  X,
  Phone,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Link2
} from 'lucide-react';
import { useFeedPosts } from '../hooks/useFeedPosts';
import { FeedPost, FeedMediaType, FeedCtaType } from '../types/feedPost';
import { useAdmin } from '../contexts/AdminContext';

function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const CATEGORIES = [
  'Chantier en cours',
  'Finition & Enduit',
  'Matériel Pro',
  'Isolation & Placo',
  'Dégât des eaux',
  'Actualité'
];

export default function FeedAdminSection() {
  const { adminCode } = useAdmin();
  const { posts, sectionEnabled, toggleSectionEnabled, saveFeedPost, deleteFeedPost } = useFeedPosts();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [googleUrl, setGoogleUrl] = useState('');
  const [customO2SwitchUrl, setCustomO2SwitchUrl] = useState('');
  const [importingGoogle, setImportingGoogle] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<FeedPost>({
    id: '',
    content: '',
    category: 'Chantier en cours',
    location: 'Le Teich · Bassin d’Arcachon',
    mediaType: 'image',
    mediaUrl: '',
    videoPosterUrl: '',
    dateLabel: formatFrenchDate(new Date()),
    publishedAt: new Date().toISOString(),
    ctaType: 'learn_more',
    ctaUrl: '/#devis',
    sourceTag: 'Actualité Chantier'
  });

  const openCreateForm = () => {
    const now = new Date();
    setForm({
      id: `post-${Date.now()}`,
      content: '',
      category: 'Chantier en cours',
      location: 'Le Teich · Bassin d’Arcachon',
      mediaType: 'image',
      mediaUrl: '',
      videoPosterUrl: '',
      dateLabel: formatFrenchDate(now),
      publishedAt: now.toISOString(),
      ctaType: 'learn_more',
      ctaUrl: '/#devis',
      sourceTag: 'Actualité Chantier'
    });
    setIsEditing(true);
    setImportNotice(null);
    setFeedback(null);
  };

  const openEditForm = (post: FeedPost) => {
    setForm({ ...post });
    setIsEditing(true);
    setImportNotice(null);
    setFeedback(null);
  };

  const handleImportGooglePost = async (autoPublish: boolean) => {
    const trimmed = googleUrl.trim();
    if (!trimmed) {
      setFeedback({
        message: 'Collez d’abord votre lien de partage Google (ex: https://share.google/...).',
        type: 'error'
      });
      return;
    }

    setImportingGoogle(true);
    setFeedback(null);
    setImportNotice(null);

    try {
      const response = await fetch('/api/import-google-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });

      const data = await response.json();
      if (!response.ok || !data?.post) {
        throw new Error(data?.error || 'Impossible de récupérer le post Google.');
      }

      const overrideMediaUrl = customO2SwitchUrl.trim();
      const isImageExtension = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(overrideMediaUrl);

      const extractedGoogleImage = data.post.mediaType === 'image' ? (data.post.mediaUrl || '') : '';
      let resolvedMediaType: FeedMediaType = data.post.mediaType || 'none';
      let resolvedMediaUrl = data.post.mediaUrl || '';
      let resolvedPosterUrl = '';

      if (overrideMediaUrl) {
        if (isImageExtension) {
          resolvedMediaType = 'image';
          resolvedMediaUrl = overrideMediaUrl;
        } else {
          resolvedMediaType = 'video';
          resolvedMediaUrl = overrideMediaUrl;
          resolvedPosterUrl = extractedGoogleImage;
        }
      }

      const imported: FeedPost = {
        id: `post-${Date.now()}`,
        content: data.post.content || '',
        category: data.post.category || 'Chantier en cours',
        location: data.post.location || 'Bassin d’Arcachon',
        mediaType: resolvedMediaType,
        mediaUrl: resolvedMediaUrl,
        videoPosterUrl: resolvedPosterUrl,
        dateLabel: data.post.dateLabel || formatFrenchDate(new Date()),
        publishedAt: data.post.publishedAt || new Date().toISOString(),
        ctaType: data.post.ctaType || 'learn_more',
        ctaUrl: data.post.ctaUrl || '/#devis',
        sourceTag: data.post.sourceTag || 'Google Établissement'
      };

      if (autoPublish) {
        const ok = await saveFeedPost(imported, adminCode);
        if (ok) {
          setGoogleUrl('');
          setCustomO2SwitchUrl('');
          setIsEditing(false);
          setFeedback({
            message: 'Post Google importé par l’IA et publié directement sur le site !',
            type: 'success'
          });
          setTimeout(() => setFeedback(null), 5000);
        } else {
          setForm(imported);
          setIsEditing(true);
          setFeedback({
            message: 'Contenu récupéré mais erreur Firestore lors de la publication directe. Cliquez sur « Enregistrer le post ».',
            type: 'error'
          });
        }
      } else {
        setForm(imported);
        setIsEditing(true);
        setGoogleUrl('');
        setCustomO2SwitchUrl('');
        setImportNotice(
          overrideMediaUrl
            ? 'Texte Google + votre lien o2switch associés ! Vérifiez l’aperçu puis enregistrez.'
            : imported.mediaUrl
            ? 'Texte et image extraits depuis Google. Attention : si votre post Google contenait une vidéo, Google ne fournit que sa miniature (pas le fichier vidéo). Vous pouvez basculer en Vidéo o2switch en 1 clic ci-dessous pour coller votre lien MP4.'
            : 'Texte extrait depuis Google ! Vous pouvez coller un lien photo ou vidéo o2switch ci-dessous.'
        );
      }
    } catch (err: any) {
      setFeedback({
        message: err?.message || 'Erreur lors de l’importation depuis Google.',
        type: 'error'
      });
    } finally {
      setImportingGoogle(false);
    }
  };

  const switchImportedImageToO2SwitchVideo = () => {
    setForm((prev) => ({
      ...prev,
      mediaType: 'video',
      videoPosterUrl: prev.mediaType === 'image' && prev.mediaUrl ? prev.mediaUrl : prev.videoPosterUrl,
      mediaUrl: ''
    }));
    setImportNotice(
      'Mode Vidéo o2switch activé ! La miniature Google a été gardée en couverture — collez maintenant le lien MP4 de votre serveur o2switch dans le champ ci-dessous.'
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) {
      setFeedback({ message: 'Veuillez saisir le texte de votre post.', type: 'error' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const ok = await saveFeedPost(form, adminCode);
    setSaving(false);

    if (ok) {
      setIsEditing(false);
      setFeedback({
        message: 'Post enregistré ! Il est visible sur la page d’accueil et sur /actualites.',
        type: 'success'
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({
        message: 'Erreur lors de la sauvegarde Firestore.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteFeedPost(id, adminCode);
    if (ok) {
      setFeedback({ message: 'Post supprimé définitivement.', type: 'success' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({
        message: 'Erreur lors de la suppression. Vérifiez votre connexion.',
        type: 'error'
      });
    }
  };

  const insertEmoji = (emoji: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + (prev.content.endsWith(' ') || prev.content === '' ? '' : ' ') + emoji + ' '
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Actualités Chantiers &amp; Posts (style Google / Facebook)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Publier des Nouveautés sur le Site
          </h2>
          <p className="text-xs text-white/60 font-light mt-1 max-w-2xl leading-relaxed">
            Publiez ici vos posts courts (comme sur votre fiche Google Établissement). Le dernier post s'affiche automatiquement sur la page d'accueil sans pop-up gênant, et tous les posts sont indexés pour Google sur la page publique.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/actualites"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white/80 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Voir /actualites</span>
          </a>

          {!isEditing && (
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un post</span>
            </button>
          )}
        </div>
      </div>

      {/* Activation / Désactivation de la section sur l'accueil */}
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              sectionEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {sectionEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Affichage sur la page d&apos;accueil
              </span>
              <span
                className={`text-[11px] font-mono ${
                  sectionEnabled ? 'text-emerald-400' : 'text-white/45'
                }`}
              >
                {sectionEnabled ? '· Activée' : '· Désactivée'}
              </span>
            </div>
            <p className="text-xs text-white/55 font-light mt-0.5">
              {sectionEnabled
                ? 'La zone « Nouveautés & Vie d’Atelier » (dernier post) est actuellement visible sur la page d’accueil.'
                : 'La zone est masquée de la page d’accueil. Vos posts restent conservés et accessibles sur /actualites.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={sectionEnabled}
          disabled={toggling}
          onClick={async () => {
            setToggling(true);
            const nextState = !sectionEnabled;
            const ok = await toggleSectionEnabled(nextState, adminCode);
            setToggling(false);
            setFeedback({
              message: ok
                ? nextState
                  ? 'Section Actualités activée sur la page d’accueil.'
                  : 'Section Actualités désactivée sur la page d’accueil.'
                : 'Erreur lors du changement de visibilité.',
              type: ok ? 'success' : 'error'
            });
            setTimeout(() => setFeedback(null), 4000);
          }}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
            sectionEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span
            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
              sectionEnabled ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm block" />
          </span>
          <span>{sectionEnabled ? 'Activée' : 'Désactivée'}</span>
        </button>
      </div>

      {/* Import Automatique depuis Lien Google Établissement */}
      <div className="bg-gradient-to-br from-amber-500/[0.08] via-[#111111] to-[#111111] border border-amber-500/30 rounded-2xl p-4 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Import Express depuis un lien Google (IA)</span>
          </div>
          <span className="text-[11px] text-white/45 font-light">
            Compatible liens <code className="text-amber-300/80">share.google/...</code> &amp; posts Google
          </span>
        </div>

        <p className="text-xs text-white/70 font-light leading-relaxed">
          Collez le lien de partage de votre post Google Établissement. Google partage le texte et une image (ou miniature si c&apos;est une vidéo) ; si votre post contient une vidéo, vous pouvez coller directement votre lien MP4 o2switch ci-dessous.
        </p>

        <div className="space-y-2.5">
          <div className="flex flex-col lg:flex-row gap-2.5">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                placeholder="1. Lien post Google : https://share.google/Q2wude8uzevDeqQNz"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/70 border border-white/15 text-xs text-white font-mono placeholder-white/30 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
              <button
                type="button"
                disabled={importingGoogle || !googleUrl.trim()}
                onClick={() => handleImportGooglePost(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                <span>Importer &amp; Vérifier</span>
              </button>

              <button
                type="button"
                disabled={importingGoogle || !googleUrl.trim()}
                onClick={() => handleImportGooglePost(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Publier en 1 clic</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Video className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={customO2SwitchUrl}
              onChange={(e) => setCustomO2SwitchUrl(e.target.value)}
              placeholder="2. Optionnel (si vidéo sur ce post) : lien MP4 ou photo o2switch (https://votredomaine.fr/...mp4)"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono placeholder-white/30 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-[#111111] border border-amber-500/30 rounded-2xl p-5 sm:p-7 space-y-5"
        >
          {importNotice && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>{importNotice}</span>
              {form.mediaType === 'image' && (
                <button
                  type="button"
                  onClick={switchImportedImageToO2SwitchVideo}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Utiliser ma vidéo MP4 o2switch</span>
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">
              {posts.some((p) => p.id === form.id) ? 'Modifier la publication' : 'Nouvelle publication'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form fields */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white">Texte du post (style Google / Facebook)</label>
                  <div className="flex items-center gap-1.5 text-xs">
                    {['✅', '🔧', '📍', '✨'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => insertEmoji(em)}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 cursor-pointer"
                        title={`Insérer ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Ex: Intervention rapide sur ce chantier au Teich. ✅ Protection intégrale des sols ✅ Ponçage raccordé à l'aspiration..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Lieu / Ville</label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Le Teich · Bassin d’Arcachon"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Date affichée</label>
                  <input
                    type="text"
                    value={form.dateLabel}
                    onChange={(e) => setForm({ ...form, dateLabel: e.target.value })}
                    placeholder="21 nov. 2026"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Media Selector — 100% URL links (zero storage on site/Firebase) */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-semibold text-white">
                    Média du post (Liens URL o2switch / Google uniquement)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    Zéro fichier stocké sur le site
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'image', label: 'Lien Photo (o2switch / Google)' },
                    { value: 'video', label: 'Lien Vidéo MP4 (o2switch)' },
                    { value: 'none', label: 'Texte seul' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, mediaType: opt.value as FeedMediaType })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        form.mediaType === opt.value
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {form.mediaType === 'image' && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="url"
                      value={form.mediaUrl || ''}
                      onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                      placeholder="Lien direct photo : https://plaquiste-arcachon.fr/photos/chantier.jpg"
                      className="w-full px-3 py-2.5 rounded-xl bg-black/70 border border-white/15 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-white/45 font-light">
                      Collez le lien de votre image hébergée sur o2switch (ou conservez l&apos;URL importée depuis Google).
                    </p>
                  </div>
                )}

                {form.mediaType === 'video' && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] text-white/65 mb-1">
                        Lien direct vidéo MP4 (hébergée sur votre serveur o2switch)
                      </label>
                      <input
                        type="url"
                        value={form.mediaUrl || ''}
                        onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                        placeholder="https://plaquiste-arcachon.fr/videos/chantier.mp4"
                        className="w-full px-3 py-2.5 rounded-xl bg-black/70 border border-white/15 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/65 mb-1">
                        Lien image miniature / couverture (optionnel)
                      </label>
                      <input
                        type="url"
                        value={form.videoPosterUrl || ''}
                        onChange={(e) => setForm({ ...form, videoPosterUrl: e.target.value })}
                        placeholder="https://... (pré-rempli automatiquement depuis Google si importé)"
                        className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Bouton d'action (style Google)</label>
                  <select
                    value={form.ctaType}
                    onChange={(e) => setForm({ ...form, ctaType: e.target.value as FeedCtaType })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="learn_more" className="bg-[#111]">En savoir plus</option>
                    <option value="call" className="bg-[#111]">Appeler (06 72 15 93 99)</option>
                    <option value="quote" className="bg-[#111]">Demander un devis</option>
                    <option value="none" className="bg-[#111]">Aucun bouton</option>
                  </select>
                </div>

                {form.ctaType === 'learn_more' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Lien de destination</label>
                    <input
                      type="text"
                      value={form.ctaUrl || ''}
                      onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                      placeholder="/chantier-propre-anti-poussiere ou /#devis"
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="lg:col-span-5">
              <span className="block text-[11px] font-mono uppercase tracking-widest text-amber-400 mb-2">
                Aperçu sur le site
              </span>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                {form.mediaType !== 'none' && form.mediaUrl ? (
                  <div className="relative h-56 sm:h-60 bg-[#070707] overflow-hidden border-b border-white/10">
                    {form.mediaType === 'video' ? (
                      <video
                        key={form.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        poster={form.videoPosterUrl || undefined}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                      >
                        <source src={form.mediaUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <>
                        <img
                          src={form.mediaUrl}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 saturate-125 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          <img
                            src={form.mediaUrl}
                            alt="Aperçu"
                            className="relative z-10 max-w-full max-h-full object-contain rounded-lg drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-44 sm:h-52 bg-black/50 flex items-center justify-center border-b border-white/10 text-white/30 text-xs">
                    {form.mediaType === 'none' ? 'Post texte uniquement' : 'Aucun média sélectionné'}
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="text-[11px] font-mono text-white/50">
                    <span className="text-amber-400">{form.dateLabel}</span>
                    {form.location && ` · ${form.location}`}
                    {` · ${form.category}`}
                  </div>
                  <p className="text-xs text-white/85 font-light leading-relaxed whitespace-pre-line">
                    {form.content || 'Votre texte apparaîtra ici...'}
                  </p>
                  {form.ctaType !== 'none' && (
                    <div className="pt-3 border-t border-white/10">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        {form.ctaType === 'call' ? (
                          <>
                            <Phone className="w-3.5 h-3.5" /> Appeler le 06 72 15 93 99
                          </>
                        ) : form.ctaType === 'quote' ? (
                          <>
                            <FileText className="w-3.5 h-3.5" /> Demander un devis
                          </>
                        ) : (
                          <>
                            En savoir plus <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Publication...' : 'Enregistrer le post'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Empty State */}
      {posts.length === 0 && !isEditing && (
        <div className="bg-[#101010] border border-white/10 rounded-2xl p-8 text-center space-y-3">
          <Newspaper className="w-8 h-8 text-white/25 mx-auto" />
          <p className="text-sm text-white/75 font-medium">
            Aucune actualité publiée pour le moment
          </p>
          <p className="text-xs text-white/45 font-light max-w-md mx-auto">
            Tant qu&apos;aucun post n&apos;est publié, la section sur la page d&apos;accueil reste automatiquement masquée.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer votre premier post</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="bg-[#101010] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              {post.mediaType !== 'none' && post.mediaUrl ? (
                <div className="relative h-44 bg-[#070707] overflow-hidden border-b border-white/10">
                  {post.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/80 text-amber-400 text-xs font-mono gap-2">
                      <Video className="w-5 h-5" />
                      <span>Vidéo MP4</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={post.mediaUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 saturate-125 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <img
                          src={post.mediaUrl}
                          alt={post.category}
                          className="relative z-10 max-w-full max-h-full object-contain rounded drop-shadow-md"
                        />
                      </div>
                    </>
                  )}
                  {index === 0 && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold uppercase">
                      À la une (Accueil)
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-20 bg-white/[0.02] border-b border-white/10 flex items-center justify-between px-4">
                  <span className="text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Sans média
                  </span>
                  {index === 0 && (
                    <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold uppercase">
                      À la une (Accueil)
                    </span>
                  )}
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-amber-400">
                  {post.dateLabel} · {post.category}
                </div>
                <p className="text-xs text-white/80 font-light leading-relaxed line-clamp-4 whitespace-pre-line">
                  {post.content}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openEditForm(post)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-amber-400" />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
