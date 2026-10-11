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

const CITY_METADATA: Record<string, { name: string; postalCode: string; lat: number; lng: number }> = {
  'le-teich': { name: 'Le Teich', postalCode: '33470', lat: 44.6322, lng: -1.0894 },
  'gujan-mestras': { name: 'Gujan-Mestras', postalCode: '33470', lat: 44.6358, lng: -1.1444 },
  'biganos': { name: 'Biganos', postalCode: '33380', lat: 44.6436, lng: -0.9786 },
  'audenge': { name: 'Audenge', postalCode: '33980', lat: 44.6853, lng: -1.0142 },
  'la-teste-de-buch': { name: 'La Teste-de-Buch', postalCode: '33260', lat: 44.6308, lng: -1.1469 },
  'mios': { name: 'Mios', postalCode: '33380', lat: 44.6053, lng: -0.9386 },
  'arcachon': { name: 'Arcachon', postalCode: '33120', lat: 44.6586, lng: -1.1644 },
  'lanton': { name: 'Lanton', postalCode: '33138', lat: 44.7042, lng: -1.0361 },
  'salles': { name: 'Salles', postalCode: '33770', lat: 44.5511, lng: -0.8711 },
};

export default function CityPage() {
  const { city } = useParams();
  
  const currentSlug = (city || 'le-teich').toLowerCase();
  const cityInfo = CITY_METADATA[currentSlug] || {
    name: city ? city.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-') : 'Bassin d\'Arcachon',
    postalCode: '33470',
    lat: 44.6322,
    lng: -1.0894
  };

  const formattedCity = cityInfo.name;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  const localSchema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://www.plaquiste-arcachon.fr/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Zone d'Intervention",
          "item": "https://www.plaquiste-arcachon.fr/#zone-intervention"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `Artisan Plâtrier Plaquiste à ${formattedCity}`,
          "item": `https://www.plaquiste-arcachon.fr/artisan-plaquiste/${currentSlug}`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
      "name": `Parat & Bouey - Artisan Plâtrier Plaquiste à ${formattedCity}`,
      "legalName": "Parat & Bouey",
      "founder": {
        "@type": "Person",
        "name": "Yohann Bouey",
        "jobTitle": "Gérant & Artisan Plâtrier-Plaquiste",
        "description": "Formé en 2009, plus de 15 ans d'expérience métier continue (depuis 2010)."
      },
      "telephone": "+33672159399",
      "url": `https://www.plaquiste-arcachon.fr/artisan-plaquiste/${currentSlug}`,
      "priceRange": "€€",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": formattedCity,
        "postalCode": cityInfo.postalCode,
        "addressRegion": "Gironde",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": cityInfo.lat,
        "longitude": cityInfo.lng
      },
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": formattedCity
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "12",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Quel est le délai pour obtenir un devis de plâtrerie ou placo à ${formattedCity} ?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Parat & Bouey se déplace sous 24h à 48h à ${formattedCity} pour examiner votre chantier et vous remet un devis gratuit et détaillé sous 48 heures.`
          }
        },
        {
          "@type": "Question",
          "name": `Comment protégez-vous mon logement lors des travaux de placo à ${formattedCity} ?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Nous mettons en place un protocole exclusif de SAS anti-poussière sous dépression pour préserver vos meubles et sols de toute poussière volatile.`
          }
        },
        {
          "@type": "Question",
          "name": `Quelles sont vos garanties pour les travaux réalisés à ${formattedCity} ?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Tous nos chantiers bénéficient de la Garantie Décennale et de la Responsabilité Civile Professionnelle souscrites chez Orus, avec plus de 15 ans d'expérience métier continue de notre artisan Yohann Bouey.`
          }
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>{`Artisan Plâtrier & Plaquiste à ${formattedCity} | 15 ans d'expérience | Parat & Bouey`}</title>
        <meta 
          name="description" 
          content={`Artisan plâtrier et plaquiste jointeur à ${formattedCity}. Formé en 2009, plus de 15 ans d'expérience métier continue (depuis 2010). Plâtrerie traditionnelle, placo, bandes et isolation. Devis gratuit au 06 72 15 93 99.`} 
        />
        <link rel="canonical" href={`https://www.plaquiste-arcachon.fr/artisan-plaquiste/${currentSlug}`} />
        <meta property="og:title" content={`Artisan Plâtrier & Plaquiste à ${formattedCity} | Parat & Bouey`} />
        <meta property="og:description" content={`Artisan plâtrier et plaquiste jointeur à ${formattedCity} avec plus de 15 ans d'expérience métier. Plâtrerie, placo et rénovation.`} />
        <meta property="og:url" content={`https://www.plaquiste-arcachon.fr/artisan-plaquiste/${currentSlug}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(localSchema)}
        </script>
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
              <div className="inline-flex items-center space-x-2 mb-4">
                <span className="w-12 h-[1px] bg-[#d1d1c4]"></span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#d1d1c4]">Artisan Local à {formattedCity}</span>
                <span className="w-12 h-[1px] bg-[#d1d1c4]"></span>
              </div>

              {/* Experience Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono mb-6">
                <span>★ Formé en 2009 • 15+ ans d'expérience métier (depuis 2010)</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Artisan Plâtrier & Plaquiste à <span className="text-[#d1d1c4]">{formattedCity}</span>
              </h1>
              
              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mx-auto mb-10 font-light">
                Expert en plâtrerie traditionnelle, pose de placo, bandes à joint et isolation à {formattedCity}. 
                Un savoir-faire artisanal éprouvé de plus de 15 ans pour des finitions lisses et durables.
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
        <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest block mb-2">Artisanat local certifié</span>
            <h2 className="text-2xl md:text-3xl font-light text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Votre projet de plâtrerie et rénovation à {formattedCity}
            </h2>
          </div>

          <div className="space-y-6 text-sm text-white/70 leading-relaxed text-justify md:text-left">
            <p>
              Vous recherchez un **artisan plâtrier-plaquiste qualifié à {formattedCity}** ou aux environs immédiats ? Parat & Bouey intervient pour tous vos travaux d'aménagement intérieur, de doublage thermique et acoustique, de pose de faux-plafonds et de réalisation de bandes à joint prêtes à peindre.
            </p>
            
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 my-6">
              <h3 className="text-amber-300 font-medium text-base mb-2 flex items-center space-x-2">
                <span>✦</span>
                <span>Un artisan chevronné (15+ ans d'expérience) sur le Bassin</span>
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Si la structure juridique actuelle Parat & Bouey est enregistrée sous une immatriculation récente (référencée sur l'annuaire d'entreprises data.gouv), son gérant et artisan Yohann Bouey exerce sans discontinuer depuis 2010 après avoir été formé dès 2009. C'est l'assurance d'un savoir-faire solide, de finitions irréprochables sous éclairage rasant et d'une garantie décennale en règle.
              </p>
            </div>

            <p>
              À {formattedCity} (que ce soit pour une maison contemporaine, une villa rénovée ou une extension en ossature bois), nous protégeons minutieusement vos sols et mobiliers grâce à notre protocole exclusif de **SAS anti-poussière sous dépression**. Vous profitez d'un intérieur sain sans poussière volatile durant tout le chantier.
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
