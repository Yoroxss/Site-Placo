import React from 'react';
import { ShieldCheck, Award, Wind, FileCheck } from 'lucide-react';

export default function GuaranteesBadge() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Garantie Décennale Orus",
      desc: "Assurance Décennale & Responsabilité Civile Professionnelle active chez Orus pour une sécurité à 100%."
    },
    {
      icon: Award,
      title: "Artisan Plâtrier-Jointeur",
      desc: "Savoir-faire artisanal qualifié. Spécialiste des finitions soignées, de la plâtrerie et du placo."
    },
    {
      icon: Wind,
      title: "Protection SAS Anti-Poussière",
      desc: "Système d'isolation de chantier en dépression pour préserver l'air et la propreté de votre habitat."
    },
    {
      icon: FileCheck,
      title: "Devis & Déplacement Gratuits",
      desc: "Étude personnalisée sans engagement avec chiffrage détaillé remis sous 48 heures."
    }
  ];

  return (
    <section className="py-12 px-6 md:px-12 bg-gradient-to-r from-white/5 via-amber-500/5 to-white/5 border-y border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="flex items-start space-x-4 p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1 tracking-wide">{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
