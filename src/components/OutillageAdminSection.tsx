import React, { useState, useEffect } from 'react';
import { 
  Wrench, Video, Image as ImageIcon, Save, CheckCircle2, 
  ExternalLink, Play, AlertCircle, RefreshCw, Eye, Sparkles,
  Layers, Wind, ShieldCheck
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { OutillageMediaConfig, DEFAULT_OUTILLAGE_MEDIA } from '../types/outillageMedia';
import { useAdmin } from '../contexts/AdminContext';

export default function OutillageAdminSection() {
  const { adminCode } = useAdmin();
  const [config, setConfig] = useState<OutillageMediaConfig>(DEFAULT_OUTILLAGE_MEDIA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  // Load configuration from Firestore with localStorage fallback
  useEffect(() => {
    const fetchConfig = async () => {
      // 1. Try local storage cache first for instant response
      try {
        const cached = localStorage.getItem('pb_outillage_media');
        if (cached) {
          setConfig(JSON.parse(cached));
        }
      } catch (e) {
        console.warn("Could not read local cache for outillage media", e);
      }

      // 2. Fetch latest from Firestore
      try {
        const docRef = doc(db, 'settings', 'outillage');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as OutillageMediaConfig;
          setConfig(prev => ({ ...prev, ...data }));
          try {
            localStorage.setItem('pb_outillage_media', JSON.stringify({ ...config, ...data }));
          } catch {}
        }
      } catch (error) {
        console.error("Erreur lors du chargement des médias outillage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload: OutillageMediaConfig = {
        ...config,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'outillage'), payload, { merge: true });
      localStorage.setItem('pb_outillage_media', JSON.stringify(payload));

      setFeedback({ 
        message: 'Liens des photos et vidéo enregistrés avec succès ! La page publique est à jour.', 
        type: 'success' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      setFeedback({ 
        message: 'Erreur lors de la sauvegarde : ' + (err.message || 'Problème de connexion'), 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof OutillageMediaConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const photoFields: {
    key: keyof OutillageMediaConfig;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    placeholder: string;
    aspect: string;
  }[] = [
    {
      key: 'heroImageUrl',
      label: "Photo Bannière d'en-tête (Hero)",
      sublabel: "Vue d'ensemble du matériel de l'artisan prêt à l'emploi (Mirka, cales, aspirateur)",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/outillage-complet.jpg',
      aspect: 'Format paysage large (21/9 ou 16/9)'
    },
    {
      key: 'makitaImageUrl',
      label: "Photo Découpeuse Oscillante Makita DTM52Z",
      sublabel: "Machine avec son carter/buse d'aspiration connecté pour découpe de placo sans poussière",
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/makita-dtm52z-aspiration.jpg',
      aspect: 'Format 16/9'
    },
    {
      key: 'mirkaImageUrl',
      label: "Photo Ponceuse Mirka Leros & Abrasifs Abranet",
      sublabel: "Ponceuse bras long en situation de ponçage de mur ou plafond",
      icon: <Wind className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/mirka-leros-chantier.jpg',
      aspect: 'Format 16/9'
    },
    {
      key: 'calesImageUrl',
      label: "Photo Cales Manuelles Aspirantes Mirka",
      sublabel: "Cale à poncer manuelle reliée au flexible d'aspiration pour angles et bords",
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/cale-aspirante-mirka.jpg',
      aspect: 'Format 16/9'
    },
    {
      key: 'aspirateurImageUrl',
      label: "Photo Aspirateur d'Atelier avec Décolmatage",
      sublabel: "Cuve d'aspiration, système de filtration de plâtre et asservissement",
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/aspirateur-chantier.jpg',
      aspect: 'Format 16/9'
    },
    {
      key: 'protectionImageUrl',
      label: "Photo Bâchage & Protections de Chantier",
      sublabel: "Sols bâchés, zone protégée ou mise en place de la protection selon chantier",
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      placeholder: 'https://votredomaine.fr/images/protection-sols-chantier.jpg',
      aspect: 'Format 16/9'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono mb-2">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Gestion des Médias de la Page Outillage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Photos & Vidéo o2switch de la Page Outillage
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light mt-1 max-w-2xl leading-relaxed">
              Configurez ici les adresses (liens URL) directes de vos photos de matériel et de votre vidéo hébergée sur votre serveur o2switch. 
              Si un lien n'est pas encore renseigné, un encart sobre s'affiche automatiquement sur la page publique.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="/chantier-propre-anti-poussiere"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white/80 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Voir la page publique</span>
            </a>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 cursor-pointer">×</button>
          </div>
        )}

        {/* Informative Help Box for o2switch */}
        <div className="mt-5 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs text-amber-200/90 font-light leading-relaxed">
          <strong className="text-amber-300 font-medium">💡 Comment héberger vos médias sur o2switch :</strong>
          <p className="mt-1 text-white/70">
            1. Connectez-vous à votre cPanel o2switch (Gestionnaire de fichiers) ou via FTP (FileZilla).<br />
            2. Déposez vos photos ou votre vidéo dans le dossier public (ex: <code>public_html/medias/</code> ou <code>public_html/videos/</code>).<br />
            3. Votre lien direct sera simplement : <code>https://votredomaine.fr/videos/ma_video.mp4</code> ou <code>https://votredomaine.fr/medias/photo.jpg</code>.<br />
            4. Collez ce lien ci-dessous et vérifiez la prévisualisation instantanée.
          </p>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1 : VIDÉO DE DÉMONSTRATION (HEBERGÉE SUR O2SWITCH)
          ========================================================================= */}
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Vidéo Démonstration Chantier (Makita DTM52Z / Aspiration)</h3>
              <p className="text-[11px] text-white/50">Hébergée sur votre serveur o2switch (format MP4 ou WebM recommandé)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            {config.videoUrl ? 'Vidéo configurée' : 'Lien en attente'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Lien URL direct de la vidéo sur o2switch (MP4) :
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={config.videoUrl || ''}
                  onChange={(e) => updateField('videoUrl', e.target.value)}
                  placeholder="https://votredomaine.fr/videos/makita_aspiration_chantier.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors font-mono"
                />
                {config.videoUrl && (
                  <button
                    type="button"
                    onClick={() => updateField('videoUrl', '')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                    title="Effacer"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="text-[10px] text-white/40 mt-1 block">
                Exemple o2switch : <code>https://votredomaine.fr/videos/nom_du_fichier.mp4</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Image de couverture de la vidéo (Poster / Miniature optionnelle) :
              </label>
              <input
                type="url"
                value={config.videoPosterUrl || ''}
                onChange={(e) => updateField('videoPosterUrl', e.target.value)}
                placeholder="https://votredomaine.fr/images/miniature-video.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors font-mono"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                Image affichée avant que le visiteur n'appuie sur Lecture.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Titre d'accompagnement de la vidéo :
                </label>
                <input
                  type="text"
                  value={config.videoTitle || ''}
                  onChange={(e) => updateField('videoTitle', e.target.value)}
                  placeholder="Découpe nette de placo & aspiration raccordée"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Description / Sous-titre de la vidéo :
                </label>
                <input
                  type="text"
                  value={config.videoDesc || ''}
                  onChange={(e) => updateField('videoDesc', e.target.value)}
                  placeholder="Démonstration de découpe chirurgicale avec la Makita DTM52Z..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Video Live Preview Player */}
          <div className="lg:col-span-5 bg-black/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-amber-300 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Aperçu direct du lecteur vidéo
            </span>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black flex items-center justify-center">
              {config.videoUrl ? (
                <video
                  key={config.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster={config.videoPosterUrl || undefined}
                  className="w-full h-full object-cover"
                >
                  <source src={config.videoUrl} type="video/mp4" />
                  Votre navigateur ne supporte pas ce format de vidéo.
                </video>
              ) : (
                <div className="p-5 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                  <span className="text-xs font-medium text-white/80">Aucun lien vidéo saisi</span>
                  <span className="text-[10px] text-white/40 mt-1 max-w-xs">
                    Renseignez le lien de votre vidéo o2switch à gauche pour tester la lecture ici.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
              <span>{config.videoTitle || 'Titre par défaut'}</span>
              {config.videoUrl && (
                <a
                  href={config.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                >
                  Ouvrir le fichier brut <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2 : LIENS DES PHOTOS DE MATÉRIEL (O2SWITCH OU EXTERNES)
          ========================================================================= */}
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Photos de l'Outillage & Matériel</h3>
              <p className="text-[11px] text-white/50">Collez le lien direct (o2switch ou autre) de vos photos de chantier pour chaque outil</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-white/40 hidden sm:inline">
            6 emplacements configurables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {photoFields.map((field) => {
            const currentUrl = (config[field.key] as string) || '';

            return (
              <div 
                key={field.key}
                className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white/5 border border-white/10 text-amber-400">
                        {field.icon}
                      </div>
                      <span className="text-xs font-semibold text-white tracking-wide">
                        {field.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                      {field.aspect}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
                    {field.sublabel}
                  </p>

                  <div className="relative">
                    <input
                      type="url"
                      value={currentUrl}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors font-mono text-[11px]"
                    />
                    {currentUrl && (
                      <button
                        type="button"
                        onClick={() => updateField(field.key, '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                        title="Effacer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview Area */}
                <div className="pt-2 border-t border-white/5">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
                    {currentUrl ? (
                      <>
                        <img 
                          src={currentUrl} 
                          alt={field.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Indicate broken image link
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const errDiv = parent.querySelector('.img-error-notice');
                              if (errDiv) (errDiv as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="img-error-notice hidden absolute inset-0 bg-red-950/80 text-red-300 text-xs p-3 flex-col items-center justify-center text-center">
                          <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                          <span>Lien d'image inaccessible</span>
                          <span className="text-[10px] text-red-200/70 mt-0.5">Vérifiez l'URL ou les permissions o2switch</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 text-center flex flex-col items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white/20 mb-1" />
                        <span className="text-[11px] text-white/40">Emplacement en attente de lien</span>
                        <span className="text-[9px] text-amber-400/60 font-mono mt-0.5">Encart propre affiché par défaut</span>
                      </div>
                    )}
                  </div>

                  {currentUrl && (
                    <div className="flex items-center justify-between mt-2 text-[10px]">
                      <span className="text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Lien renseigné
                      </span>
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                      >
                        Ouvrir en grand <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="sticky bottom-20 md:bottom-6 z-30 bg-[#161616]/95 border border-white/15 rounded-2xl p-4 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Modifications enregistrées immédiatement sur votre base de données Firebase.</span>
          <span className="sm:hidden">Sauvegarde directe sur la page publique.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Enregistrement...' : 'Enregistrer tout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
