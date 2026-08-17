const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./firestore_images.json', 'utf8'));

console.log('--- GALLERY ITEMS ---');
data.gallery.forEach((g, i) => {
  console.log(`Item ${i}: id=${g.id}, title=${g.title || g.alt}, is_data_url=${g.url ? g.url.startsWith('data:') : false}, url_start=${g.url ? g.url.substring(0, 80) : ''}`);
});

console.log('--- BEFORE/AFTER ITEMS ---');
data.ba.forEach((ba, i) => {
  console.log(`BA ${i}: id=${ba.id}, title=${ba.title}, before_data=${ba.beforeUrl ? ba.beforeUrl.startsWith('data:') : false}, after_data=${ba.afterUrl ? ba.afterUrl.startsWith('data:') : false}`);
});
