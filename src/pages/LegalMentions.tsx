import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LegalMentions() {
  return (
    <div className="min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-4xl mx-auto text-white">
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium hover:opacity-70 transition-opacity mb-12 text-white/60">
        <ArrowLeft className="w-4 h-4" /> Retour au site
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-12" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Mentions Légales</h1>
        
        <div className="space-y-12">
          <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl tracking-widest uppercase text-[#d1d1c4] mb-6 font-light">Éditeur du site</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Le présent site est édité par : Yohann BOUEY<br />
              Domicilié au : 6 rue Jacques Beynel, 33470 Le Teich<br />
              Téléphone : 06 72 15 93 99<br />
              Email : contact@plaquiste-arcachon.fr
            </p>
          </section>

          <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl tracking-widest uppercase text-[#d1d1c4] mb-6 font-light">Statut de l'entreprise</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Dénomination sociale : PARAT ET BOUEY<br />
              Forme juridique : SASU au capital de 150€<br />
              Numéro de TVA intracommunautaire : FR57106599426<br />
              SIRET : 10659942600017
            </p>
          </section>

          <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl tracking-widest uppercase text-[#d1d1c4] mb-6 font-light">Directeur de la publication</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Le directeur de la publication est : Yohann BOUEY
            </p>
          </section>

          <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl tracking-widest uppercase text-[#d1d1c4] mb-6 font-light">Hébergement</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Ce site est hébergé par Google Cloud Run.
            </p>
          </section>

          <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl tracking-widest uppercase text-[#d1d1c4] mb-6 font-light">Politique de Cookies</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Ce site utilise des cookies pour assurer le bon fonctionnement du site et améliorer l'expérience utilisateur.
              Les cookies strictement nécessaires sont toujours activés. Vous avez la possibilité d'accepter ou de refuser les cookies
              via le bandeau d'information qui s'affiche lors de votre première visite.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
