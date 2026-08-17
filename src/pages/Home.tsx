import { motion, AnimatePresence } from 'motion/react';
import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EditableText from '../components/EditableText';
import GuaranteesBadge from '../components/GuaranteesBadge';
import FloatingMobileCta from '../components/FloatingMobileCta';
import { useSiteContent } from '../hooks/useSiteContent';
import { ShieldCheck, Wind, Ruler, ChevronLeft, ChevronRight, X } from 'lucide-react';

const QuoteForm = lazy(() => import('../components/QuoteForm'));
const Carousel3D = lazy(() => import('../components/Carousel3D'));
const BeforeAfterSlider = lazy(() => import('../components/BeforeAfterSlider'));
const FaqSection = lazy(() => import('../components/FaqSection'));
const InterventionZone = lazy(() => import('../components/InterventionZone'));
const ReviewsSection = lazy(() => import('../components/ReviewsSection'));
const BlogSection = lazy(() => import('../components/BlogSection'));


import { DEFAULT_GALLERY_IMAGES, DEFAULT_BEFORE_AFTER_ITEMS } from '../data/defaultImages';

export default function Home() {
  const { content, loading } = useSiteContent();

  const [images, setImages] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('pb_gallery_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_GALLERY_IMAGES;
  });

  const [beforeAfterItems, setBeforeAfterItems] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('pb_ba_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BEFORE_AFTER_ITEMS;
  });

  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayImages = images.length > 0 ? images : DEFAULT_GALLERY_IMAGES;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -window.innerWidth * 0.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: window.innerWidth * 0.5, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchFirestoreData = async () => {
      try {
        const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const qBA = query(collection(db, 'beforeAfter'), orderBy('createdAt', 'desc'));

        const [snapshot, baSnapshot] = await Promise.all([getDocs(q), getDocs(qBA)]);

        if (isMounted) {
          if (snapshot?.docs) {
            const fetched = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            if (fetched.length > 0) {
              setImages(fetched);
              try { localStorage.setItem('pb_gallery_cache', JSON.stringify(fetched)); } catch {}
            }
          }
          if (baSnapshot?.docs) {
            const fetchedBA = baSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            if (fetchedBA.length > 0) {
              setBeforeAfterItems(fetchedBA);
              try { localStorage.setItem('pb_ba_cache', JSON.stringify(fetchedBA)); } catch {}
            }
          }
        }
      } catch (e) {
        console.warn("Firestore gallery fetch notice:", e);
      }
    };

    fetchFirestoreData();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (selectedImage === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev !== null ? (prev + 1) % displayImages.length : null));
      } else if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, displayImages.length]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % displayImages.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + displayImages.length) % displayImages.length);
    }
  };

  return (
    <>
      <Header />
      
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex flex-col md:grid md:grid-cols-12 gap-0 pt-24 md:pt-0">
          
          {/* Left Panel: Text Content */}
          <div className="col-span-12 md:col-span-5 p-8 md:p-12 flex flex-col justify-center md:border-r border-white/5 z-20">
            <div className="mb-6 inline-flex items-center space-x-2 text-[#d1d1c4] uppercase tracking-widest text-[10px] md:text-xs">
              <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
              <span>Le Teich & Bassin d'Arcachon</span>
            </div>
            
            <div className="mb-8">
              <EditableText
                contentKey="heroTitle"
                value={content.heroTitle}
                as="h1"
                className="text-4xl md:text-6xl lg:text-7xl leading-[1] font-light"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              />
            </div>
            
            <div className="mb-10 max-w-md">
              <EditableText
                contentKey="heroSubtitle"
                value={content.heroSubtitle}
                as="p"
                multiline
                className="text-white/60 text-sm md:text-base leading-relaxed font-light"
              />
            </div>
            
            {/* Quick Action */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest opacity-60">Projet en cours ?</span>
                <span className="text-[#d1d1c4] text-[10px] md:text-xs font-semibold">Étude Gratuite</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#devis" className="flex-1 text-center bg-white text-black text-[10px] md:text-xs font-bold uppercase px-6 py-3 rounded-lg hover:bg-[#d1d1c4] transition-colors">
                  Demander un devis
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel: Visual Area */}
          <div className="col-span-12 md:col-span-7 relative flex items-center justify-center p-4 md:p-12 overflow-hidden min-h-[580px] md:min-h-[500px]">
            <div className="relative w-full h-full flex items-center justify-center max-w-2xl">
              <div className="absolute md:left-10 md:top-1/2 md:-translate-y-1/2 w-[90%] md:w-72 h-auto md:h-80 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-3xl z-30 flex flex-col p-6 shadow-2xl backdrop-blur-xl -translate-y-24 md:translate-y-0">
                <div className="h-1 w-8 bg-[#d1d1c4] mb-4"></div>
                <span className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Innovation</span>
                <h3 className="text-xl font-light mb-4 text-white">SAS Anti-Poussière</h3>
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-tighter">
                  Système d'extraction en dépression pour garantir la santé et la propreté de votre intérieur.
                </p>
              </div>
              
              <div className="absolute md:right-0 w-[95%] md:w-[450px] h-[340px] md:h-[550px] bg-black/40 rounded-3xl overflow-hidden shadow-2xl border border-white/15 translate-y-12 md:translate-y-0">
                <img 
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  src={displayImages[0]?.url || DEFAULT_GALLERY_IMAGES[0]?.url}
                  alt={displayImages[0]?.alt || DEFAULT_GALLERY_IMAGES[0]?.alt || "Aménagement intérieur Parat & Bouey"}
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/60 flex flex-col justify-between p-6 md:p-8 z-10 pointer-events-none">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase opacity-90 mb-1.5 text-amber-300 font-mono block">Rénovation & Aménagement</span>
                    <h2 className="text-xl md:text-3xl font-light text-white leading-tight drop-shadow-md" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      Le Respect de votre Foyer
                    </h2>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
              </div>
              
              <div className="hidden md:flex absolute top-0 right-10 w-24 h-24 border border-white/10 rounded-full items-center justify-center">
                 <span className="text-[8px] uppercase tracking-widest opacity-20 text-center px-2">Bassin<br/>d'Arcachon</span>
              </div>
            </div>
          </div>
        </section>

        {/* GARANTIES & BADGES DE CONFIANCE */}
        <GuaranteesBadge />

        {/* GALERIE / RÉALISATIONS */}
        <section id="realisations" className="py-16 md:py-32 px-0 md:px-12 border-t border-white/5 relative bg-[#0a0a0a] overflow-hidden">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-12 px-6 md:px-0">
              <div>
                <div className="mb-3 md:mb-4 inline-flex items-center space-x-2 text-[#d1d1c4] uppercase tracking-widest text-[10px]">
                  <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
                  <span>Galerie Projets</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-light text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  Nos Réalisations
                </h2>
              </div>
            </div>
            
            <Suspense fallback={<div className="h-96 w-full" />}>
              <Carousel3D images={displayImages} onImageClick={setSelectedImage} />
            </Suspense>
          </div>
        </section>

        {/* L'ENGAGEMENT SÉRÉNITÉ */}
        <section 
          id="engagement" 
          className="py-20 md:py-32 px-6 md:px-12 relative z-10 border-t border-white/5 bg-[#0a0a0a] overflow-hidden"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6"
            >
              <div className="mb-6 inline-flex items-center space-x-2 text-amber-400 uppercase tracking-widest text-[10px] font-mono">
                <span className="w-8 h-[1px] bg-amber-400"></span>
                <span>L'Engagement Sérénité</span>
              </div>

              <h3 className="text-3xl md:text-5xl font-light mb-8 leading-tight text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Nous savons que des travaux sont un bouleversement.
              </h3>

              <div className="space-y-6 text-white/80 leading-relaxed font-light text-sm md:text-base">
                <EditableText
                  contentKey="aboutText1"
                  value={content.aboutText1}
                  multiline
                />
                <EditableText
                  contentKey="aboutText2"
                  value={content.aboutText2}
                  multiline
                />
              </div>
            </motion.div>
            
            {/* Right Column: 3 Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(245,158,11,0.08)_0%,_transparent_70%)] rounded-full -z-10 pointer-events-none"></div>
              
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl backdrop-blur-md shadow-xl">
                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-amber-400 mb-3" />
                <h4 className="font-medium text-base text-white tracking-wide mb-2">Protection totale</h4>
                <p className="text-[10px] md:text-xs text-white/50 leading-relaxed uppercase tracking-widest">Votre foyer est un sanctuaire. Protection des sols et mobiliers.</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl backdrop-blur-md shadow-xl sm:translate-y-4">
                <Wind className="w-6 h-6 md:w-8 md:h-8 text-amber-400 mb-3" />
                <h4 className="font-medium text-base text-white tracking-wide mb-2">Air sain</h4>
                <p className="text-[10px] md:text-xs text-white/50 leading-relaxed uppercase tracking-widest">Utilisation d'un SAS anti-poussière et systèmes d'extraction.</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl backdrop-blur-md shadow-xl sm:col-span-2 sm:max-w-xs">
                <Ruler className="w-6 h-6 md:w-8 md:h-8 text-amber-400 mb-3" />
                <h4 className="font-medium text-base text-white tracking-wide mb-2">Précision & Rigueur</h4>
                <p className="text-[10px] md:text-xs text-white/50 leading-relaxed uppercase tracking-widest">Où le désordre est trop souvent la règle, j'impose la rigueur.</p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* LIGHTBOX */}
        <AnimatePresence>
          {selectedImage !== null && displayImages[selectedImage] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-2 md:p-6 select-none"
              onClick={() => setSelectedImage(null)}
            >
              {/* Barre Supérieure Fixe (Fixed Top Bar with Counter) */}
              <div 
                className="w-full flex items-center justify-center px-3 py-3 md:px-8 md:py-4 z-[260] bg-gradient-to-b from-black/90 via-black/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Compteur d'images */}
                <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-mono text-amber-300 tracking-wider backdrop-blur-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>{selectedImage + 1} / {displayImages.length}</span>
                </div>
              </div>

              {/* Navigation Précédente (Previous Arrow) */}
              <button 
                aria-label="Image précédente"
                className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-[260] p-3 md:p-5 bg-black/80 hover:bg-amber-500 hover:text-black border border-white/20 text-white rounded-full transition-all duration-300 shadow-2xl active:scale-95 flex items-center justify-center cursor-pointer"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Navigation Suivante (Next Arrow) */}
              <button 
                aria-label="Image suivante"
                className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-[260] p-3 md:p-5 bg-black/80 hover:bg-amber-500 hover:text-black border border-white/20 text-white rounded-full transition-all duration-300 shadow-2xl active:scale-95 flex items-center justify-center cursor-pointer"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Conteneur Image principale */}
              <div 
                className="relative max-w-5xl w-full my-auto flex flex-col items-center justify-center px-2 md:px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Image cliquable (cliquer pour fermer) */}
                <div 
                  className="relative group cursor-pointer max-w-full flex justify-center items-center"
                  onClick={() => setSelectedImage(null)}
                  title="Cliquer pour fermer"
                >
                  <img 
                    loading="lazy" 
                    src={displayImages[selectedImage].url} 
                    alt={displayImages[selectedImage].alt || displayImages[selectedImage].title}
                    className="max-w-full max-h-[65vh] md:max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/15 hover:opacity-95 transition-opacity"
                  />
                </div>
                
                <div className="mt-3 text-center max-w-xl px-2 flex flex-col items-center">
                  <h3 className="text-base md:text-xl text-white font-serif italic mb-1">
                    {displayImages[selectedImage].title}
                  </h3>
                  {displayImages[selectedImage].description && (
                    <p className="text-xs md:text-sm text-white/70 font-light">
                      {displayImages[selectedImage].description}
                    </p>
                  )}
                </div>
              </div>

              {/* Marge inférieure sous la barre de navigation mobile */}
              <div className="h-6 w-full shrink-0 md:hidden" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AVANT/APRES */}
        {beforeAfterItems.length > 0 && (
          <section className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5 relative bg-[#050505]">
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-center mb-16">
                <div className="inline-flex items-center space-x-2 text-[#d1d1c4] uppercase tracking-widest text-[10px]">
                  <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
                  <span>L'évolution</span>
                  <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
                </div>
              </div>
              
              <div className="space-y-16">
                {beforeAfterItems.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <h3 className="text-2xl md:text-3xl font-light text-white mb-8" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {item.title}
                    </h3>
                    <Suspense fallback={null}>
                      <BeforeAfterSlider beforeImage={item.beforeUrl} afterImage={item.afterUrl} />
                    </Suspense>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SERVICES */}
        <section id="services" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-[radial-gradient(circle,_rgba(26,43,44,0.6)_0%,_transparent_70%)] -z-10 rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center mb-16">
              <div className="inline-flex items-center space-x-2 text-[#d1d1c4] uppercase tracking-widest text-[10px]">
                <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
                <span>Exemples de Services</span>
                <span className="w-8 h-[1px] bg-[#d1d1c4]"></span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Aménagement Intérieur",
                  desc: "Création de cloisons sèches, faux-plafonds, aménagement de pièces. Isolation, pose de structures métalliques, placage avec des plaques de plâtres, jointage et finitions."
                },
                {
                  title: "Plâtrerie Traditionnelle",
                  desc: "Réparation d'enduits, de murs et plafonds en plâtre. Plafonnage. Application de plâtre traditionnel, fixateur ou durcisseur de fond. Eau de chaux."
                },
                {
                  title: "Dégâts des Eaux",
                  desc: "Remise en état complète après sinistre (inondations, fuites). Inspection, découpe et solution adaptée. Remplacement des isolants et placo. Peinture en option."
                }
              ].map((service, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.2 }}
                  className="bg-white/5 p-10 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors duration-500 group backdrop-blur-sm"
                >
                  <div className="text-3xl font-light text-white/20 mb-6 group-hover:text-[#d1d1c4] transition-colors duration-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>0{idx + 1}.</div>
                  <h3 className="text-xl tracking-wide mb-4 text-white font-light">{service.title}</h3>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest leading-relaxed">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AVIS CLIENTS */}
        <Suspense fallback={null}>
          <ReviewsSection />
        </Suspense>

        {/* ARTICLES & CONSEILS TECHNIQUES (SEO BASSIN D'ARCACHON) */}
        <Suspense fallback={null}>
          <BlogSection />
        </Suspense>

        {/* FAQ SECTION */}
        <Suspense fallback={null}>
          <FaqSection />
        </Suspense>

        {/* DEVIS FORM */}
        <section className="py-24 md:py-32 px-6 md:px-12 relative border-t border-white/5">
          <div className="max-w-7xl mx-auto relative z-10">
            <Suspense fallback={null}>
              <QuoteForm />
            </Suspense>
          </div>
        </section>

        {/* ZONES D'INTERVENTION (20KM LE TEICH) */}
        <Suspense fallback={null}>
          <InterventionZone />
        </Suspense>
      </main>

      <FloatingMobileCta />
      <Footer />
    </>
  );
}
