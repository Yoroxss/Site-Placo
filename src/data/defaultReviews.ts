export interface ReviewItem {
  id?: string;
  author: string;
  city: string;
  rating: number;
  comment: string;
  projectType: string;
  date?: string;
  verified?: boolean;
}

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'def-1',
    author: 'Philippe & Claire M.',
    city: 'Le Teich',
    rating: 5,
    comment: 'Travail d’une rareté exceptionnelle ! Parat & Bouey a refait l’intégralité des cloisons et plafonds de notre séjour. Le système de SAS anti-poussière a protégé tous nos meubles. Les joints sont strictement invisibles avant peinture. Un vrai artisan de confiance.',
    projectType: 'Création de cloisons & faux-plafond',
    date: 'Juillet 2026',
    verified: true
  },
  {
    id: 'def-2',
    author: 'Laurent D.',
    city: 'Gujan-Mestras',
    rating: 5,
    comment: 'Intervention suite à un dégât des eaux au plafond. Diagnostic précis, découpe propre, pose du placo et bandes de calicot parfaites. Ponctuel, poli et chantier rendu impeccable.',
    projectType: 'Réparation dégât des eaux',
    date: 'Juin 2026',
    verified: true
  },
  {
    id: 'def-3',
    author: 'Sophie B.',
    city: 'Arcachon',
    rating: 5,
    comment: 'Réalisation d’une bibliothèque sur-mesure en plaque de plâtre. Résultat moderne, alignements millimétrés. On sent la passion du métier et le respect du client.',
    projectType: 'Aménagement sur-mesure',
    date: 'Mai 2026',
    verified: true
  }
];
