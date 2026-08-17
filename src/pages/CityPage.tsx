import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import QuoteForm from '../components/QuoteForm';
import FaqSection from '../components/FaqSection';
import GuaranteesBadge from '../components/GuaranteesBadge';
import FloatingMobileCta from '../components/FloatingMobileCta';
import { motion } from 'motion/react';
import { ShieldCheck, Wind, Ruler, ArrowLeft, FileText, ImageIcon, Home } from 'lucide-react';
import { useEffect } from 'react';

export default function CityPage() {
  const { city } = useParams();
  
  // Format city name for display (e.g., "gujan-mestras" -> "Gujan-Mestras")
  const formattedCity = city 
    ? city.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')
    : 'Bassin d\'Arcachon';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  return (
    <>
      <Helmet>
        <title>Artisan Plaquiste Jointeur à {formattedCity} | Parat & Bouey</title>
        <meta name="description" content={`Vous cherchez un artisan plaquiste jointeur qualifié à ${formattedCity} ? Rénovation intérieure, plâtrerie, isolation. Demandez votre devis gratuit.`} />
      </Helmet>

      <Header />
      
      <main className="flex-1">
        {/* HERO SEO */}
        <section className="relative min-h-[60vh] flex items-center pt-28 pb-12 px-6 md:px-12">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#0a0a0a] bg-opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]"></div>
          </div>
          
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            {/* Top Back Breadcrumb */}
            <div className="flex justify-start mb-4">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </Link>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 mb-6">
                <span className="w-12 h-[1px] bg-[#d1d1c4]"></span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#d1d1c4]">Intervention à {formattedCity}</span>
                <span className="w-12 h-[1px] bg-[#d1d1c4]"></span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Artisan Plaquiste & Jointeur à <span className="text-[#d1d1c4]">{formattedCity}</span>
              </h1>
              
              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mx-auto mb-10 font-light">
                Expert en aménagement intérieur, plâtrerie traditionnelle et isolation à {formattedCity}. 
                Une rigueur absolue pour des finitions parfaites, du sol au plafond.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a 
                  href="#devis" 
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 text-black text-xs uppercase tracking-wider font-bold hover:bg-amber-400 transition-colors rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Obtenir un devis gratuit</span>
                </a>

                <Link 
                  to="/#realisations" 
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 border border-white/20 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/20 transition-colors rounded-xl flex items-center justify-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Voir nos réalisations</span>
                </Link>

                <Link 
                  to="/" 
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/10 text-white/80 text-xs uppercase tracking-wider font-medium hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>Accueil</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SERVICES / ENGAGEMENT CONTENT */}
        <section className="py-24 px-6 md:px-12 bg-white/5 border-y border-white/10 relative">
          <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-[#d1d1c4] mb-4" />
                <h3 className="text-lg text-white mb-3 font-medium">Protection Totale</h3>
                <p className="text-xs text-white/50 leading-relaxed uppercase tracking-widest">
                  Votre chantier à {formattedCity} est protégé avec soin avant toute intervention. Sols et mobiliers sont bâchés.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl md:-translate-y-4">
                <Wind className="w-8 h-8 text-[#d1d1c4] mb-4" />
                <h3 className="text-lg text-white mb-3 font-medium">Air Sain</h3>
                <p className="text-xs text-white/50 leading-relaxed uppercase tracking-widest">
                  Utilisation d'un SAS anti-poussière pour garantir la propreté de votre habitat durant nos travaux.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl">
                <Ruler className="w-8 h-8 text-[#d1d1c4] mb-4" />
                <h3 className="text-lg text-white mb-3 font-medium">Finition Parfaite</h3>
                <p className="text-xs text-white/50 leading-relaxed uppercase tracking-widest">
                  Rigueur et précision sont les maîtres mots de notre approche pour un rendu irréprochable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO TEXT CONTENT */}
        <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-8" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Votre projet de rénovation à {formattedCity}
          </h2>
          <div className="space-y-6 text-sm text-white/60 leading-relaxed text-justify md:text-center">
            <p>
              Parat & Bouey est votre partenaire de confiance pour tous vos projets de rénovation et d'aménagement intérieur à {formattedCity} et ses alentours. Que vous souhaitiez créer de nouveaux espaces, isoler thermiquement et phoniquement vos murs, ou réaliser des faux-plafonds, notre expertise d'artisan plaquiste et jointeur vous garantit un résultat à la hauteur de vos attentes.
            </p>
            <p>
              Nous mettons un point d'honneur à respecter votre lieu de vie à {formattedCity}. Nos méthodes de travail rigoureuses (SAS anti-poussière, protection complète) assurent un chantier propre et des finitions soignées, prêtes à peindre.
            </p>
          </div>
        </section>

        {/* FAQ SECTION */}
        <FaqSection />

        {/* DEVIS FORM */}
        <section className="py-24 md:py-32 px-6 md:px-12 relative border-t border-white/5">
          <div className="max-w-7xl mx-auto relative z-10">
            <QuoteForm />
          </div>
        </section>

        <GuaranteesBadge />
      </main>
      
      <FloatingMobileCta />
      <Footer />
    </>
  );
}
