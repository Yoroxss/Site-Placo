const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="50%" stop-color="#0a0a0a" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#d97706" stop-opacity="0.8" />
    </linearGradient>
  </defs>

  <!-- Dark Background Circle (Perfect for Google SERP circular crop) -->
  <circle cx="256" cy="256" r="252" fill="url(#bgGrad)" />

  <!-- Outer Golden Luxury Ring -->
  <circle cx="256" cy="256" r="240" fill="none" stroke="url(#ringGrad)" stroke-width="14" />
  <circle cx="256" cy="256" r="224" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.4" stroke-dasharray="10 8" />

  <!-- Bold Vector Monogram: P -->
  <!-- Stem of P -->
  <rect x="100" y="130" width="36" height="250" rx="8" fill="url(#goldGrad)" />
  <!-- Bowl of P -->
  <path d="M 136 130 L 210 130 C 265 130 265 245 210 245 L 136 245 Z" fill="url(#goldGrad)" />
  <path d="M 136 162 L 198 162 C 228 162 228 213 198 213 L 136 213 Z" fill="#0a0a0a" />

  <!-- Bold Vector Monogram: B -->
  <!-- Stem of B -->
  <rect x="270" y="130" width="36" height="250" rx="8" fill="url(#goldGrad)" />
  <!-- Upper Bowl of B -->
  <path d="M 306 130 L 375 130 C 420 130 420 235 375 235 L 306 235 Z" fill="url(#goldGrad)" />
  <path d="M 306 160 L 365 160 C 388 160 388 205 365 205 L 306 205 Z" fill="#0a0a0a" />
  <!-- Lower Bowl of B -->
  <path d="M 306 235 L 385 235 C 435 235 435 380 385 380 L 306 380 Z" fill="url(#goldGrad)" />
  <path d="M 306 265 L 375 265 C 400 265 400 350 375 350 L 306 350 Z" fill="#0a0a0a" />

  <!-- Subtle Architect / Plâtrerie Balance Bar Underneath -->
  <rect x="100" y="405" width="312" height="6" rx="3" fill="url(#goldGrad)" opacity="0.9" />
  <circle cx="256" cy="408" r="7" fill="#fbbf24" />
</svg>`;

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  console.log('Saved public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // Generate Google-compliant sizes (multiples of 48x48)
  const sizes = [
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-144x144.png', size: 144 },
    { name: 'icon-192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-512.png', size: 512 }
  ];

  for (const s of sizes) {
    await sharp(svgBuffer)
      .resize(s.size, s.size)
      .png({ quality: 100 })
      .toFile(path.join(publicDir, s.name));
    console.log(`Generated ${s.name} (${s.size}x${s.size})`);
  }

  // Create favicon.ico (48x48 PNG container supported as ICO by all modern browsers & Googlebot)
  // Sharp can output raw buffer or we write a 48x48 PNG into favicon.ico:
  // Google explicitly accepts PNG formatted icon named favicon.ico or 48x48 PNG linked as favicon
  const ico48Buffer = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico48Buffer);
  console.log('Generated public/favicon.ico (48x48)');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
