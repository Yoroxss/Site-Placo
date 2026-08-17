const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./firestore_images.json', 'utf8'));

const gallery = data.gallery.map(item => ({
  id: item.id,
  title: item.title || item.alt || 'Réalisation Parat & Bouey',
  description: item.description || 'Projet de plâtrerie & isolation sur le Bassin d\'Arcachon',
  url: item.url,
  alt: item.alt || item.title || 'Plâtrerie Parat & Bouey'
}));

const beforeAfter = data.ba.map(item => ({
  id: item.id,
  title: item.title || 'Transformation sur-mesure',
  description: item.description || 'Rénovation complète placo et isolation',
  beforeUrl: item.beforeUrl,
  afterUrl: item.afterUrl
}));

const tsContent = `// Real default fallback images loaded directly from user's gallery in Firestore
export const DEFAULT_GALLERY_IMAGES = ${JSON.stringify(gallery, null, 2)};

export const DEFAULT_BEFORE_AFTER_ITEMS = ${JSON.stringify(beforeAfter, null, 2)};
`;

fs.writeFileSync('./src/data/defaultImages.ts', tsContent);
console.log('Successfully generated /src/data/defaultImages.ts with', gallery.length, 'gallery items and', beforeAfter.length, 'before/after items.');
