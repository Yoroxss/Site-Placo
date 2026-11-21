import { FeedPost } from '../types/feedPost';

export const DEFAULT_FEED_POSTS: FeedPost[] = [
  {
    id: 'gmb-post-2026-11-13',
    content:
      "Intervention rapide sur ce chantier. Les étapes réalisées :\n✅ Protection intégrale des sols et de la pièce\n✅ Ponçage raccordé à l'aspiration à la source pour limiter au maximum les poussières\n✅ Finitions soignées prêtes à peindre sur tout le Bassin d'Arcachon.",
    category: 'Chantier en cours',
    location: 'Le Teich · Bassin d’Arcachon',
    mediaType: 'image',
    mediaUrl: '/gallery_defaults/gallery-6.jpg',
    dateLabel: '13 nov. 2026',
    publishedAt: '2026-11-13T10:00:00.000Z',
    ctaType: 'learn_more',
    ctaUrl: '/chantier-propre-anti-poussiere',
    sourceTag: 'Actualité Chantier'
  },
  {
    id: 'gmb-post-2026-10-31',
    content:
      "Un résultat impeccable ne s'improvise pas. 🔧 Pour obtenir des plafonds et des murs parfaitement lisses avant mise en peinture, chaque bande à joint et chaque passe d'enduit est contrôlée sous lumière rasante avant le ponçage final.",
    category: 'Finition & Enduit',
    location: 'Gujan-Mestras',
    mediaType: 'image',
    mediaUrl: '/gallery_defaults/gallery-3.jpg',
    dateLabel: '31 oct. 2026',
    publishedAt: '2026-10-31T10:00:00.000Z',
    ctaType: 'learn_more',
    ctaUrl: '/#realisations',
    sourceTag: 'Savoir-faire'
  },
  {
    id: 'gmb-post-2026-10-15',
    content:
      "Des plafonds impeccables sans traces de reprise ! En plus de nos gammes professionnelles habituelles (Flügger 2S mat profond anti-reflet pour les pièces très lumineuses), nous prenons en charge vos finitions sur demande après reprise placo ou dégât des eaux.",
    category: 'Matériaux Pro',
    location: 'Bassin d’Arcachon',
    mediaType: 'image',
    mediaUrl: '/gallery_defaults/gallery-1.jpg',
    dateLabel: '15 oct. 2026',
    publishedAt: '2026-10-15T10:00:00.000Z',
    ctaType: 'call',
    ctaUrl: '',
    sourceTag: 'Conseil Pro'
  }
];
