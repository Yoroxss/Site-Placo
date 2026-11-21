import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Wrench, Wind, ShieldCheck, ArrowLeft, FileText, 
  Check, ImageIcon, Sparkles, Layers, Phone, Play,
  Video, Eye, ExternalLink, Scissors
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FaqSection from '../components/FaqSection';
import FloatingMobileCta from '../components/FloatingMobileCta';
import { OutillageMediaConfig, DEFAULT_OUTILLAGE_MEDIA } from '../types/outillageMedia';

interface MediaCardProps {
  aspectRatio?: '16/9' | '4/3' | '21/9';
  label: string;
  subtext: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
  imageUrl?: string;
}

function MediaCard({ 
  aspectRatio = '16/9', 
  label, 
  subtext, 
  icon,
  className = '',
  badge = 'Photo d’illustration',
  imageUrl
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const aspectClass = 
    aspectRatio === '4/3' ? 'aspect-[4/3]' :
    aspectRatio === '21/9' ? 'aspect-[21/9]' : 'aspect-video';

  // If a valid image URL is provided and has not errored out, display the actual photo
  if (imageUrl && !imgError) {
    return (
      <div 
        className={`relative w-full ${aspectClass} rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-black shadow-xl group transition-all duration-300 hover:border-amber-500/40 ${className}`}
      >
        <img 
          src={imageUrl} 
          alt={label}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Ambient bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

        {/* Top badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/15 text-[10px] font-mono text-amber-300 backdrop-blur-md shadow-lg">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{badge}</span>
        </div>

        {/* Bottom caption */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none text-left">
          <span className="block text-xs md:text-sm font-semibold text-white tracking-wide leading-snug drop-shadow-md">
            {label}
          </span>
          {subtext && (
            <span className="block text-[10px] md:text-xs text-white/70 font-light mt-0.5 line-clamp-1 drop-shadow-sm">
              {subtext}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback: Elegant placeholder indicating where the photo fits
  return (
    <div 
      className={`relative w-full ${aspectClass} rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.03] via-black/50 to-black/80 p-6 flex flex-col items-center justify-center text-center group hover:border-amber-500/30 transition-all shadow-xl ${className}`}
    >
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-amber-300 backdrop-blur-md">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>{badge}</span>
      </div>

      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-amber-500/40 transition-transform">
        {icon || <ImageIcon className="w-6 h-6 text-amber-400/80" />}
      </div>

      <span className="relative text-xs md:text-sm font-semibold text-white tracking-wide mb-1 max-w-sm">
        {label}
      </span>
      <span className="relative text-[10px] md:text-xs text-white/50 max-w-xs font-light leading-relaxed">
        {subtext}
      </span>
    </div>
  );
}

export default function ChantierProprePage() {
  const [mediaConfig, setMediaConfig] = useState<OutillageMediaConfig>(DEFAULT_OUTILLAGE_MEDIA);

  useEffect(() => {
    window.scrollTo(0, 0);

    // 1. Instant local storage read to prevent layout shift
    try {
      const cached = localStorage.getItem('pb_outillage_media');
      if (cached) {
        setMediaConfig(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Could not read local cache for outillage media", e);
    }

    // 2. Real-time Firestore sync
    const docRef = doc(db, 'settings', 'outillage');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as OutillageMediaConfig;
        setMediaConfig(prev => ({ ...prev, ...data }));
        try {
          localStorage.setItem('pb_outillage_media', JSON.stringify({ ...DEFAULT_OUTILLAGE_MEDIA, ...data }));
        } catch {}
      }
    }, (err) => {
      console.warn("Deferred outillage settings sync notice:", err);
    });

    return () => unsub();
  }, []);

  const tools = [
    {
      id: 'makita',
      name: 'Découpeuse Oscillante Makita DTM52Z & Aspiration',
      role: 'Découpes nettes de placo, boîtiers & encastrements',
      desc: 'Pour découper une réservation de boîte électrique, créer une trappe de visite ou araser un rail métallique sans projeter de poussière blanche partout, j’utilise un outil oscillant Makita DTM52Z équipé de son carter d’aspiration spécifique relié directement à l’aspirateur d’atelier.',
      imageKey: 'makitaImageUrl' as const,
      imageTitle: 'Découpeuse Makita DTM52Z raccordée à l’aspiration',
      imageSub: 'Découpes nettes et chirurgicales de BA13 sans nuage de poussière',
      icon: <Scissors className="w-6 h-6 text-amber-400" />,
      points: [
        'Découpe chirurgicale et nette sans éclater le carton du plâtre',
        'Captage immédiat de la poussière à la dent de lame par le carter d’aspiration',
        'Indispensable pour les encastrements et finitions soignées en intérieur habité'
      ]
    },
    {
      id: 'mirka',
      name: 'Ponceuse Mirka Leros & Abrasifs Abranet',
      role: 'Ponçage des grandes surfaces (murs & plafonds)',
      desc: 'Une machine reconnue pour sa légèreté et son plateau flexible à 180°. Associée à des abrasifs micro-perforés Abranet directement reliés à l’aspirateur, elle capte le gros de la poussière d’enduit au moment précis où le grain ponce la surface.',
      imageKey: 'mirkaImageUrl' as const,
      imageTitle: 'Ponceuse Mirka Leros en situation de ponçage',
      imageSub: 'Tête flexible et raccordement direct sur l’aspiration de chantier',
      icon: <Wind className="w-6 h-6 text-amber-400" />,
      points: [
        'Évite la formation du gros nuage de plâtre volant dans la pièce',
        'Mouvement orbital régulier pour limiter les rayures d’abrasif',
        'Gain de confort réel pour les yeux et les voies respiratoires'
      ]
    },
    {
      id: 'cales',
      name: 'Cales Manuelles Aspirantes Mirka',
      role: 'Finition des angles, bordures et plinthes',
      desc: 'Là où la ponceuse ne passe pas (angles rentrants, bas de cloisons, entourages de fenêtres), beaucoup d’artisans poncent à sec avec une simple cale en mousse qui empoussière tout. J’utilise des cales manuelles elles aussi raccordées au tuyau d’aspiration.',
      imageKey: 'calesImageUrl' as const,
      imageTitle: 'Cale à poncer manuelle Mirka avec flexible d’aspiration',
      imageSub: 'Précision sur les angles et bords sans dispersion inutile',
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      points: [
        'Aspiration maintenue même sur les petites finitions manuelles',
        'Ponçage soigné des arêtes et des angles rentrants',
        'Moins de poussière fine qui retombe au sol le long des plinthes'
      ]
    },
    {
      id: 'aspirateur',
      name: 'Aspirateur d’Atelier avec Décolmatage',
      role: 'Captage continu sans perte d’aspiration',
      desc: 'La poussière de plâtre et d’enduit est extrêmement fine et colmate les filtres ménagers en quelques minutes. Un aspirateur professionnel muni d’un décolmatage automatique et de filtres adaptés permet de maintenir une puissance d’aspiration constante tout au long de la phase de ponçage.',
      imageKey: 'aspirateurImageUrl' as const,
      imageTitle: 'Aspirateur professionnel de chantier avec décolmatage',
      imageSub: 'Cuve étanche et filtration adaptée aux poussières de plâtre',
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      points: [
        'Aspiration continue sans perte de débit pendant le travail',
        'Sac et filtre spécifiques pour retenir les micro-particules',
        'Branchement asservi directement sur les outils (Makita, Mirka)'
      ]
    },
    {
      id: 'protections',
      name: 'Protections & Bâchage Selon Chantier',
      role: 'Déployées selon la nature et l’ampleur des travaux',
      desc: 'Selon les besoins et la configuration des lieux : bâchage des sols de passage, protection des meubles exposés et mise en place d’un extracteur d’air ou d’une porte de séparation lorsque la pièce s’y prête, notamment lors de réfections de plafonds complets en maison occupée.',
      imageKey: 'protectionImageUrl' as const,
      imageTitle: 'Bâchage des sols et protection de la zone de travail',
      imageSub: 'Moyens de protection adaptés au cas par cas selon les travaux',
      icon: <ShieldCheck className="w-6 h-6 text-amber-400" />,
      points: [
        'Bâches feutrées épaisses pour protéger les sols existants',
        'Possibilité de fermer la pièce avec une porte temporaire zippée',
        'Aération et extraction étudiées selon la configuration de votre logement'
      ]
    }
  ];

  const faqs = [
    {
      question: "Y aura-t-il quand même de la poussière chez moi ?",
      answer: "Soyons clairs : oui, un peu. Dans les métiers du plâtre et de la rénovation, le zéro poussière absolu n'existe pas. Quiconque vous promet un chantier sans un seul grain de poussière n'est pas réaliste. En revanche, le fait d'aspirer à la source avec du matériel Mirka, une découpeuse oscillante Makita DTM52Z raccordée et d'éviter le ponçage à sec traditionnel change tout : il n'y a pas d'épais nuage qui flotte dans la pièce, le gros des résidus part directement dans la cuve de l'aspirateur, et le nettoyage final reste simple et rapide."
    },
    {
      question: "Pourquoi utiliser une découpeuse Makita DTM52Z avec aspiration plutôt qu'une scie classique ?",
      answer: "La scie sabre ou la scie égoïne projette des jets de poussière de plâtre vers le bas et sur les côtés à chaque coup de dent. L'outil multifonction oscillant Makita DTM52Z fonctionne par micro-oscillations rapides et dispose d'une buse d'aspiration qui enveloppe l'axe de coupe. La poussière de plâtre est avalée dès qu'elle se détache, et la coupe reste millimétrique sans arracher le carton du plâtre."
    },
    {
      question: "Installez-vous ces protections lourdes sur tous les petits chantiers ?",
      answer: "Non, nous adaptons toujours les moyens à la réalité du chantier. Si vous m'appelez pour réparer une saignée ou reboucher un trou après dégât des eaux sur 1 m², nous protégeons le sol immédiat et ponçons à la cale aspirante sans déployer un sas complet qui n'aurait aucun sens. Les dispositifs plus lourds (fermetures, extracteurs) sont réservés aux chantiers plus conséquents (rénovation complète de plafonds, ponçage de pièces entières en maison habitée)."
    },
    {
      question: "Pourquoi investir dans ce matériel plutôt que des outils standards ?",
      answer: "C’est avant tout un choix d’artisan pour travailler dans de bonnes conditions : des machines plus légères, une aspiration efficace qui fatigue moins le corps, et des abrasifs de qualité qui n'encrassent pas le plâtre. Pour vous, cela se traduit simplement par un chantier réalisé plus sereinement et des finitions plus régulières avant mise en peinture."
    },
    {
      question: "Que dois-je préparer avant votre venue ?",
      answer: "Simplement dégager l'accès à la zone d'intervention (pousser un meuble s'il gêne ou ranger les objets fragiles à proximité). Pour le reste, nous apportons nos propres bâches de protection pour le sol de la zone de travail."
    }
  ];

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "headline": "Outillage & Matériel Professionnel | Parat & Bouey",
    "description": "Présentation du matériel professionnel utilisé par Yohann Bouey : découpeuse oscillante Makita DTM52Z, ponceuse Mirka Leros, cales aspirantes et gestion des poussières sur le Bassin d'Arcachon.",
    "publisher": {
      "@type": "Organization",
      "name": "Parat & Bouey",
      "url": "https://www.plaquiste-arcachon.fr"
    },
    "url": "https://www.plaquiste-arcachon.fr/chantier-propre-anti-poussiere"
  };

  return (
    <>
      <Helmet>
        <title>Matériel & Outillage Professionnel | Parat & Bouey - Bassin d'Arcachon</title>
        <meta 
          name="description" 
          content="Découvrez le matériel professionnel utilisé par notre artisan : Makita DTM52Z aspirée, ponceuse Mirka Leros, cales aspirantes et outillage adapté pour un travail soigné sur le Bassin d'Arcachon." 
        />
        <link rel="canonical" href="https://www.plaquiste-arcachon.fr/chantier-propre-anti-poussiere" />
        <meta property="og:title" content="Matériel & Outillage Professionnel | Parat & Bouey" />
        <meta property="og:description" content="Découpeuse oscillante Makita DTM52Z avec carter d'aspiration, ponceuse Mirka Leros, cales de ponçage aspirantes et filtration d'atelier." />
        <meta property="og:url" content="https://www.plaquiste-arcachon.fr/chantier-propre-anti-poussiere" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify(schemaJson)}
        </script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* =========================================================================
            1. HERO SECTION (Sobre, artisanale, avec image paramétrable)
            ========================================================================= */}
        <section className="relative min-h-[65vh] flex items-center pt-28 pb-14 px-6 md:px-12 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/5 blur-[150px] pointer-events-none rounded-full" />
          
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            
            {/* Top Breadcrumb */}
            <div className="flex justify-start mb-6">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à l'accueil</span>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-300 text-[10px] md:text-xs font-mono uppercase tracking-widest mb-6">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Équipement Professionnel de l'Artisan</span>
              </div>

              {/* Title */}
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-5 leading-tight" 
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                Le choix d'un outillage professionnel<br />
                <span className="text-[#d1d1c4] font-normal">pour vos travaux d'intérieur.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto font-light leading-relaxed mb-6">
                Découpeuse oscillante Makita DTM52Z avec carter aspiré, ponceuse Mirka Leros, cales manuelles et filtration d'atelier : un matériel professionnel sélectionné pour travailler dans de bonnes conditions, limiter les nuisances de poussière et garantir des finitions régulières chez vous.
              </p>

              {/* Realism Note */}
              <div className="max-w-xl mx-auto mb-8 p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200/90 font-light leading-relaxed">
                <strong className="font-semibold text-amber-300">Un mot d'honnêteté :</strong> Dans les métiers du plâtre, la « poussière zéro » n’existe pas. Mais être équipé d’outils adaptés avec aspiration permet de travailler proprement et de réduire grandement les désagréments du ponçage et des découpes.
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                <Link
                  to="/#devis"
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-black text-xs uppercase tracking-wider font-bold hover:bg-amber-400 transition-all rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Demander un devis sur la page d'accueil</span>
                </Link>

                <a
                  href="#video-demonstration"
                  className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/15 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Voir la vidéo en action</span>
                </a>

                <a
                  href="#outillage"
                  className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/15 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center space-x-2"
                >
                  <span>Voir le matériel</span>
                </a>
              </div>

              {/* Hero Image (Customizable via Admin/o2switch) */}
              <div className="max-w-3xl mx-auto">
                <MediaCard
                  aspectRatio="21/9"
                  imageUrl={mediaConfig.heroImageUrl}
                  label="L’outillage de l'artisan prêt à l'emploi sur le chantier"
                  subtext="Makita DTM52Z raccordée, ponceuse Mirka Leros, cales manuelles et aspirateur"
                  badge="Matériel Professionnel"
                  icon={<Wrench className="w-7 h-7 text-amber-400" />}
                />
              </div>

            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            2. SECTION VIDÉO : DÉMONSTRATION CHANTIER O2SWITCH (Makita DTM52Z & Aspiration)
            ========================================================================= */}
        <section id="video-demonstration" className="py-20 md:py-24 px-6 md:px-12 border-t border-white/5 bg-[#070707] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/[0.04] blur-[140px] pointer-events-none rounded-full" />

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-amber-400 font-mono text-[10px] md:text-xs uppercase tracking-widest block mb-2 flex items-center justify-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                Démonstration Vidéo en Conditions Réelles
              </span>
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-3"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {mediaConfig.videoTitle || "La découpe & l'aspiration en action sur chantier"}
              </h2>
              <p className="text-xs md:text-sm text-white/60 font-light leading-relaxed">
                {mediaConfig.videoDesc || "Découvrez le fonctionnement concret du matériel : découpe nette avec la Makita DTM52Z et captage immédiat de la poussière à la source."}
              </p>
            </div>

            {/* Video Player Container */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl p-1 md:p-2 bg-gradient-to-b from-white/10 via-black to-black">
              <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {mediaConfig.videoUrl ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={mediaConfig.videoPosterUrl || undefined}
                    className="w-full h-full object-cover rounded-xl md:rounded-2xl"
                  >
                    <source src={mediaConfig.videoUrl} type="video/mp4" />
                    Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
                  </video>
                ) : (
                  /* Placeholder when video link not yet filled by user */
                  <div className="p-8 text-center flex flex-col items-center justify-center relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
                      <Play className="w-7 h-7 md:w-9 md:h-9 ml-1 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-sm md:text-base font-semibold text-white tracking-wide mb-1.5">
                      Vidéo de démonstration en cours d’intégration
                    </span>
                    <p className="text-xs text-white/60 max-w-md font-light leading-relaxed mb-4">
                      Démonstration en situation réelle : découpe de plaque de plâtre avec la machine oscillante Makita DTM52Z raccordée à l’aspirateur avec carter anti-poussière.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Hébergement direct o2switch</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Context Bar under Video */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <Scissors className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Makita DTM52Z</span>
                  <span className="text-white/50 text-[11px]">Système oscillant précis Starlock Plus</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <Wind className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Carter d'Aspiration Dédié</span>
                  <span className="text-white/50 text-[11px]">Avale la poussière dès la ligne de coupe</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Aspiration Asservie</span>
                  <span className="text-white/50 text-[11px]">Démarrage synchrone avec l'outil</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. SECTION: LE MATÉRIEL UTILISÉ SUR LE TERRAIN (5 Cartes + Photos configurables)
            ========================================================================= */}
        <section id="outillage" className="py-20 md:py-28 px-6 md:px-12 border-t border-white/5 bg-[#090909]">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-amber-400 font-mono text-[10px] md:text-xs uppercase tracking-widest block mb-2">
                Équipement de travail
              </span>
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-3"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                Le matériel qui fait la différence au quotidien
              </h2>
              <p className="text-xs md:text-sm text-white/60 font-light leading-relaxed">
                Pas pour en faire des tonnes, mais simplement parce qu’avec de bons outils adaptés, le travail est mieux fait et le chantier est plus agréable pour tout le monde.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {tools.map((t) => {
                const imageUrl = mediaConfig[t.imageKey];

                return (
                  <div 
                    key={t.id}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-7 flex flex-col justify-between hover:border-amber-500/20 transition-all backdrop-blur-sm"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          {t.icon}
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-medium text-white">
                            {t.name}
                          </h3>
                          <span className="text-[11px] text-amber-400/80 font-mono">
                            {t.role}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs md:text-sm text-white/70 font-light leading-relaxed mb-4">
                        {t.desc}
                      </p>

                      <ul className="space-y-1.5 mb-5">
                        {t.points.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2 text-xs text-white/80 font-light">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Image / Photo (Customizable via Admin or o2switch direct URL) */}
                    <MediaCard
                      aspectRatio="16/9"
                      imageUrl={imageUrl}
                      label={t.imageTitle}
                      subtext={t.imageSub}
                      badge="Outillage en situation"
                      icon={t.icon}
                    />
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* =========================================================================
            4. SECTION: UNE APPROCHE ADAPTÉE SELON LE CHANTIER
            ========================================================================= */}
        <section className="py-20 md:py-24 px-6 md:px-12 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto">
            
            <div className="p-7 md:p-9 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Adaptabilité & Bon Sens</span>
              </div>

              <h3 
                className="text-2xl md:text-3xl font-light text-white"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                Une protection adaptée au cas par cas
              </h3>

              <p className="text-xs md:text-sm text-white/70 leading-relaxed font-light">
                Tous les chantiers ne se ressemblent pas. On ne met pas en place la même logistique pour reprendre une fissure sur un mur que pour rénover l’ensemble des faux-plafonds d’une maison habitée.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-white/80 font-light">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <span className="font-semibold text-white block">Petites interventions & réparations</span>
                  <p className="text-white/60 leading-relaxed">
                    Protection immédiate des sols au pied du mur, découpe nette à la Makita DTM52Z raccordée, ponçage direct à la cale aspirante, et nettoyage des abords en partant.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <span className="font-semibold text-white block">Rénovations complètes de pièces</span>
                  <p className="text-white/60 leading-relaxed">
                    Bâchage complet des zones de passage, calfeutrement de la porte de la pièce en travaux et aération adaptée pour préserver le reste du logement.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-white/50 italic pt-2">
                Les mesures de protection sont toujours abordées avec vous lors de la visite préalable pour que vous sachiez exactement à quoi vous attendre.
              </p>
            </div>

          </div>
        </section>

        {/* =========================================================================
            5. FOIRE AUX QUESTIONS 3D
            ========================================================================= */}
        <FaqSection 
          customFaqs={faqs} 
          title="Questions sur le Ponçage & l'Outillage" 
          subtitle="Naviguez au clavier, avec la molette ou en cliquant sur les cartes" 
        />

        {/* =========================================================================
            6. APPEL À L'ACTION & REDIRECTION DEVIS
            ========================================================================= */}
        <section className="py-20 md:py-28 px-6 md:px-12 relative border-t border-white/5 bg-[#050505]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono mb-3">
              <span className="w-8 h-[1px] bg-amber-400"></span>
              <span>Devis Gratuit & Étude Personnalisée</span>
              <span className="w-8 h-[1px] bg-amber-400"></span>
            </div>

            <h2 
              className="text-2xl md:text-4xl font-light text-white mb-4 leading-tight"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Un projet de plâtrerie ou de rénovation ?
            </h2>

            <p className="text-xs md:text-sm text-white/60 font-light leading-relaxed mb-8 max-w-xl mx-auto">
              Basé au Teich, je me déplace sur l'ensemble du Bassin d'Arcachon pour évaluer vos travaux et vous transmettre un devis détaillé sans engagement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/#devis"
                className="w-full sm:w-auto px-7 py-3.5 bg-amber-500 text-black text-xs uppercase tracking-wider font-bold hover:bg-amber-400 transition-all rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Remplir le formulaire de devis sur l'accueil</span>
              </Link>

              <a
                href="tel:0672159399"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs uppercase tracking-wider font-semibold transition-colors rounded-xl flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Appeler au 06 72 15 93 99</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <FloatingMobileCta />
      <Footer />
    </>
  );
}
