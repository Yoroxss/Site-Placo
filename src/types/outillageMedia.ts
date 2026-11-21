export interface OutillageMediaConfig {
  heroImageUrl?: string;
  mirkaImageUrl?: string;
  calesImageUrl?: string;
  aspirateurImageUrl?: string;
  makitaImageUrl?: string;
  protectionImageUrl?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  videoTitle?: string;
  videoDesc?: string;
  updatedAt?: any;
}

export const DEFAULT_OUTILLAGE_MEDIA: OutillageMediaConfig = {
  heroImageUrl: '',
  mirkaImageUrl: '',
  calesImageUrl: '',
  aspirateurImageUrl: '',
  makitaImageUrl: '',
  protectionImageUrl: '',
  videoUrl: '',
  videoPosterUrl: '',
  videoTitle: 'Découpe nette de placo & aspiration raccordée en direct',
  videoDesc: 'Démonstration de découpe chirurgicale avec la Makita DTM52Z et captage immédiat des poussières par l’aspirateur d’atelier.'
};
