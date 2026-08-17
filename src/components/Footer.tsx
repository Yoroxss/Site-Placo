import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, CheckCircle2, Clock, Sparkles, Lock, ArrowUpRight, BookOpen } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const cities = [
    { name: 'Le Teich', slug: 'le-teich' },
    { name: 'Gujan-Mestras', slug: 'gujan-mestras' },
    { name: 'Biganos', slug: 'biganos' },
    { name: 'La Teste-de-Buch', slug: 'la-teste-de-buch' },
    { name: 'Arcachon', slug: 'arcachon' },
    { name: 'Audenge', slug: 'audenge' },
    { name: 'Mios', slug: 'mios' },
    { name: 'Lanton', slug: 'lanton' },
  ];

  const services = [
    { 
      label: 'Pose de Placo & Cloisons', 
      href: '/blog/choisir-plaque-de-platre-cloisons-bassin-arcachon-placo-hydro-phonique' 
    },
    { 
      label: 'Jointoiement & Bandes Papier', 
      href: '/blog/pourquoi-choisir-platrier-jointeur-plutot-que-peintre-pour-les-bandes' 
    },
    { 
      label: 'Isolation Phonique & Thermique', 
      href: '/blog/isolation-phonique-thermique-maison-bois-echoppe-bassin-arcachon' 
    },
    { 
      label: 'Rénovation & Dégât des Eaux', 
      href: '/blog/que-faire-apres-degat-des-eaux-plafond-platre-bassin-arcachon' 
    },
    { 
      label: 'Ratissage & Finition Peinture', 
      href: '/blog/ratissage-lissage-enduit-preparation-plafond-peinture-bassin-arcachon' 
    },
  ];

  return (
    <footer className="relative z-20 bg-[#060606] text-white pt-16 pb-24 md:pb-12 border-t border-amber-500/20 overflow-hidden">
      {/* Background Subtle Radial Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-amber-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Top Section: Reassurance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12 mb-12 border-b border-white/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3.5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-white">Garantie Décennale</span>
              <span className="block text-[10px] text-white/50 font-mono">Assurance Orus & Responsabilité</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3.5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-white">Devis Gratuit sous 48h</span>
              <span className="block text-[10px] text-white/50 font-mono">Déplacement offert sur le Bassin</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3.5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-white">Protection Anti-Poussière</span>
              <span className="block text-[10px] text-white/50 font-mono">Chantier propre & SAS de confinement</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3.5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-white">Norme DTU 25.41</span>
              <span className="block text-[10px] text-white/50 font-mono">Bandes papier & finitions zéro défaut</span>
            </div>
          </div>
        </div>

        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 mb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Presentation (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>
                PARAT & BOUEY
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Artisan
              </span>
            </div>

            <p className="text-xs text-white/60 font-light leading-relaxed max-w-sm">
              Artisan plâtrier-jointeur spécialisé en rénovation, pose de cloisons, isolation et bandes à joints traditionnelles sur le Bassin d'Arcachon. Travail soigné et finitions prêtes à peindre.
            </p>

            {/* Direct Contact Pill */}
            <div className="pt-2">
              <a
                href="tel:0672159399"
                className="inline-flex items-center space-x-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-mono transition-all group"
              >
                <Phone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold">06 72 15 93 99</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400/60" />
              </a>
            </div>
          </div>

          {/* Col 2: Services (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Prestations Plâtrerie
            </h4>
            <ul className="space-y-1 text-xs text-white/70 font-light">
              {services.map((serv, idx) => (
                <li key={idx}>
                  <Link to={serv.href} className="hover:text-amber-300 transition-colors flex items-center space-x-1.5 min-h-[44px] px-2.5 py-2.5 rounded-lg hover:bg-white/5 active:bg-white/10">
                    <span className="text-amber-500/60 text-xs">›</span>
                    <span>{serv.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Cities / Zones d'intervention (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Secteurs d'Intervention
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs text-white/80 font-light">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/artisan-plaquiste/${city.slug}`}
                  className="hover:text-amber-300 transition-colors flex items-center space-x-2 text-xs min-h-[44px] py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 active:bg-white/15"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{city.name}</span>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-white/40 font-mono pt-1">
              • Rayon de 20 km autour de Le Teich (33470)
            </p>
          </div>

          {/* Col 4: Blog & Legal Metas (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Informations
            </h4>
            <ul className="space-y-1 text-xs text-white/70 font-light">
              <li>
                <Link to="/blog" className="text-amber-300 hover:text-amber-200 transition-colors flex items-center space-x-1.5 min-h-[44px] px-2 py-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium">Conseils & Blog</span>
                </Link>
              </li>
              <li>
                <a href="mailto:contact@plaquiste-arcachon.fr" className="hover:text-amber-300 transition-colors flex items-center space-x-1.5 text-xs min-h-[44px] px-2 py-2.5">
                  <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <span className="truncate">Email Contact</span>
                </a>
              </li>
              <li>
                <Link to="/mentions-legales" className="hover:text-white transition-colors text-xs flex items-center min-h-[44px] px-2 py-2.5">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-white/30 hover:text-amber-400 transition-colors text-[11px] font-mono flex items-center space-x-1.5 min-h-[44px] px-2 py-2.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Espace Admin</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal Metas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-wider text-white/40 pt-4">
          <div>
            © {currentYear} PARAT & BOUEY • Plâtrerie & Jointeur Bassin d'Arcachon
          </div>

          <div className="flex items-center space-x-4">
            <span>SIRET : 10659942600017</span>
            <span>•</span>
            <span className="text-amber-400/80">Région Nouvelle-Aquitaine</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
