import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Layers,
  Info,
  Link2,
  Edit3,
  Globe,
  Tag,
  ClipboardPaste,
  RotateCcw
} from 'lucide-react';

interface LaserQrGeneratorProps {
  onScanSimulate?: (url: string) => void;
}

export default function LaserQrGenerator({ onScanSimulate }: LaserQrGeneratorProps) {
  // Mode selection:
  // 'official' = plaquiste-arcachon.fr with campaign tracking
  // 'manual' = Free manual address input
  const [generatorMode, setGeneratorMode] = useState<'official' | 'manual'>('official');

  // Official site configuration
  const [baseDomain, setBaseDomain] = useState<'https://plaquiste-arcachon.fr' | 'plaquiste-arcachon.fr'>('https://plaquiste-arcachon.fr');
  const [campaignTag, setCampaignTag] = useState<string>('j');
  const [selectedSubPath, setSelectedSubPath] = useState<string>('/');

  // Manual URL input
  const [manualUrl, setManualUrl] = useState<string>('https://plaquiste-arcachon.fr/?r=j');

  // Laser Optimization settings
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L'); // 'L' is least dense = biggest chunky blocks
  const [margin, setMargin] = useState<number>(2); // Quiet zone modules
  const [kerfOffsetPercent, setKerfOffsetPercent] = useState<number>(6); // 6% module shrink to compensate laser burning spot (anti-bleeding)
  const [tokenEngraveAreaMm, setTokenEngraveAreaMm] = useState<number>(20); // 20mm standard engraving area on token
  const [pngResolution] = useState<number>(2048);

  // Generated outputs
  const [svgString, setSvgString] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [matrixSize, setMatrixSize] = useState<number>(21);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick preset shortcuts for manual mode
  const manualPresets = [
    { label: 'Accueil direct', url: 'https://plaquiste-arcachon.fr' },
    { label: 'Jeton caddie (?r=j)', url: 'https://plaquiste-arcachon.fr/?r=j' },
    { label: 'Demande de devis', url: 'https://plaquiste-arcachon.fr/#devis' },
    { label: 'Avis clients', url: 'https://plaquiste-arcachon.fr/#avis' },
    { label: 'Galerie photos', url: 'https://plaquiste-arcachon.fr/#galerie' },
    { label: 'Sans https (Ultra-court)', url: 'plaquiste-arcachon.fr/?r=j' },
  ];

  // Quick campaign tag presets
  const campaignPresets = [
    { tag: 'j', label: 'Jeton Caddie (?r=j)', desc: 'Recommandé pour les jetons' },
    { tag: 'caddie', label: 'Caddie (?r=caddie)', desc: 'Alternative jeton' },
    { tag: 'teich', label: 'Le Teich (?r=teich)', desc: 'Distribution Le Teich' },
    { tag: 'arcachon', label: 'Arcachon (?r=arcachon)', desc: 'Distribution Arcachon' },
    { tag: 'gujan', label: 'Gujan (?r=gujan)', desc: 'Distribution Gujan' },
    { tag: 'lateste', label: 'La Teste (?r=lateste)', desc: 'Distribution La Teste' },
    { tag: 'chantier', label: 'Chantier (?r=chantier)', desc: 'Panneau de chantier' },
    { tag: 'carte', label: 'Carte de visite (?r=carte)', desc: 'Flyers / Cartes' },
    { tag: '', label: 'Sans tag (Site direct)', desc: 'Aucun paramètre' },
  ];

  // Compute final encoded URL string
  const encodedUrl = useMemo(() => {
    if (generatorMode === 'manual') {
      return manualUrl.trim() || 'https://plaquiste-arcachon.fr';
    }

    // Official mode
    let url = baseDomain;
    if (selectedSubPath && selectedSubPath !== '/') {
      url += selectedSubPath;
    }

    const cleanTag = campaignTag.trim();
    if (cleanTag) {
      const sep = url.includes('?') ? '&' : (url.includes('#') ? '?' : '/?');
      if (url.includes('#')) {
        // insert before hash or append
        const parts = url.split('#');
        url = `${parts[0]}?r=${cleanTag}#${parts[1]}`;
      } else {
        url = `${url.replace(/\/$/, '')}/?r=${cleanTag}`;
      }
    }

    return url;
  }, [generatorMode, manualUrl, baseDomain, selectedSubPath, campaignTag]);

  // Compute laser metric indicators
  const moduleSizeMm = matrixSize > 0 
    ? Number((tokenEngraveAreaMm / (matrixSize + margin * 2)).toFixed(2)) 
    : 0.8;
  
  const totalModulesCount = matrixSize * matrixSize;

  // Generate QR Code vector matrix and optimized SVG
  useEffect(() => {
    let isCancelled = false;

    const generateCodes = async () => {
      try {
        setIsGenerating(true);

        const targetString = encodedUrl.trim() || 'https://plaquiste-arcachon.fr';

        // 1. Create QR Matrix
        const qr = QRCode.create(targetString, {
          errorCorrectionLevel: errorLevel
        });

        const size = qr.modules.size;
        if (!isCancelled) {
          setMatrixSize(size);
        }

        // 2. Generate precision laser SVG with Kerf compensation (Anti-Bleeding)
        const totalSize = size + margin * 2;
        const shrinkFactor = (100 - kerfOffsetPercent) / 100;
        const offset = (1 - shrinkFactor) / 2;

        let rectsSvg = '';
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (qr.modules.get(row, col)) {
              const x = (col + margin + offset).toFixed(4);
              const y = (row + margin + offset).toFixed(4);
              const w = shrinkFactor.toFixed(4);
              const h = shrinkFactor.toFixed(4);
              rectsSvg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000000" shape-rendering="crispEdges"/>`;
            }
          }
        }

        const customSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges" width="100%" height="100%"><rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>${rectsSvg}</svg>`;

        // 3. Ultra-HD PNG
        const pngUrl = await QRCode.toDataURL(targetString, {
          errorCorrectionLevel: errorLevel,
          margin: margin,
          width: pngResolution,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        if (!isCancelled) {
          setSvgString(customSvg);
          setPngDataUrl(pngUrl);
        }
      } catch (err) {
        console.error('Erreur génération QR Code:', err);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generateCodes();

    return () => {
      isCancelled = true;
    };
  }, [encodedUrl, errorLevel, margin, kerfOffsetPercent, pngResolution]);

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-laser-plaquiste-arcachon-${matrixSize}x${matrixSize}-LightBurn.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download HD PNG
  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = `qr-laser-plaquiste-arcachon-${matrixSize}x${matrixSize}-${pngResolution}px.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy SVG Code
  const handleCopySvg = async () => {
    if (!svgString) return;
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  // Copy Encoded URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(encodedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {}
  };

  // Paste from clipboard in manual mode
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setManualUrl(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-md text-white mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl tracking-wide uppercase text-amber-300 font-light font-serif">
                Générateur QR Gravure Laser (LightBurn & Vectoriel)
              </h2>
              <p className="text-xs text-white/60">
                Générez des QR codes directs pour <strong className="text-white">plaquiste-arcachon.fr</strong> ou saisissez manuellement toute adresse de votre choix.
              </p>
            </div>
          </div>
        </div>

        {/* Live Matrix Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold ${
            matrixSize <= 25 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Matrice : {matrixSize} × {matrixSize} ({totalModulesCount} pavés)
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono">
            Pavé : ~{moduleSizeMm} mm sur jeton de {tokenEngraveAreaMm}mm
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controls & Configuration */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. CHOIX DU MODE D'ADRESSE */}
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" /> 1. Mode de configuration de l'adresse
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {encodedUrl.length} caractères encodés
              </span>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Official domain mode */}
              <button
                type="button"
                onClick={() => setGeneratorMode('official')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  generatorMode === 'official'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    plaquiste-arcachon.fr
                  </span>
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded font-mono">Direct & Suivi</span>
                </div>
                <div className="text-[11px] text-white/70">
                  Adresse officielle du site avec identifiant de suivi pour vos jetons ou chantiers.
                </div>
              </button>

              {/* Manual URL input mode */}
              <button
                type="button"
                onClick={() => setGeneratorMode('manual')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  generatorMode === 'manual'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    Saisie Manuelle
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded font-mono">100% Libre</span>
                </div>
                <div className="text-[11px] text-white/70">
                  Tapez ou collez n'importe quelle adresse, page ou lien personnalisé.
                </div>
              </button>
            </div>

            {/* MODE 1 : CONFIGURATION DU DOMAINE OFFICIEL */}
            {generatorMode === 'official' && (
              <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-4">
                
                {/* Domain & HTTPS toggle */}
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-amber-200/80 font-semibold">
                    Format du domaine :
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBaseDomain('https://plaquiste-arcachon.fr')}
                      className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                        baseDomain === 'https://plaquiste-arcachon.fr'
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-black/40 text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      https://plaquiste-arcachon.fr
                      <span className="block text-[10px] font-sans font-normal opacity-80 mt-0.5">
                        Standard sécurisé (100% universel)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBaseDomain('plaquiste-arcachon.fr')}
                      className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                        baseDomain === 'plaquiste-arcachon.fr'
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-black/40 text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      plaquiste-arcachon.fr
                      <span className="block text-[10px] font-sans font-normal opacity-80 mt-0.5">
                        Sans https (-8 car. = pavés encore plus gros)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Campaign Tag (for Jetons, Flyers, etc.) */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-wider text-amber-200/80 font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      Identifiant de campagne / provenance (paramètre ?r=) :
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-mono font-bold">?r=</span>
                    <input
                      type="text"
                      value={campaignTag}
                      onChange={(e) => setCampaignTag(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="j"
                      className="flex-1 bg-black/60 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    {campaignTag && (
                      <button
                        type="button"
                        onClick={() => setCampaignTag('')}
                        className="px-2.5 py-2 text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Effacer le paramètre de campagne"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  {/* Preset campaign chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-white/50 block">Raccourcis de campagnes rapides :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {campaignPresets.map((p) => (
                        <button
                          key={p.tag}
                          type="button"
                          onClick={() => setCampaignTag(p.tag)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                            campaignTag === p.tag
                              ? 'bg-amber-500 text-black font-bold shadow'
                              : 'bg-black/40 hover:bg-white/15 text-white/70 border border-white/10'
                          }`}
                          title={p.desc}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2 : SAISIE MANUELLE LIBRE */}
            {generatorMode === 'manual' && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    Entrez manuellement l'adresse ou l'URL complète :
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                    title="Coller depuis le presse-papier"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Coller</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://plaquiste-arcachon.fr"
                    className="w-full bg-black/60 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                  {manualUrl && (
                    <button
                      type="button"
                      onClick={() => setManualUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-2 py-1 rounded cursor-pointer"
                      title="Vider le champ"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Preset quick links for manual input */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-white/50 block">Modèles d'adresses pré-remplis :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {manualPresets.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setManualUrl(preset.url)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                          manualUrl === preset.url
                            ? 'bg-emerald-500 text-black font-bold shadow'
                            : 'bg-black/40 hover:bg-white/15 text-white/70 border border-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live encoded URL display & test link */}
            <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between gap-3">
              <div className="truncate min-w-0 flex-1">
                <span className="text-[9px] uppercase tracking-widest text-amber-400 block font-semibold mb-0.5">
                  Adresse encodée dans le QR ({encodedUrl.length} caractères) :
                </span>
                <span className="text-xs font-mono text-white/95 truncate block select-all">
                  {encodedUrl}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  title="Copier l'adresse"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <a
                  href={encodedUrl.startsWith('http') ? encodedUrl : `https://${encodedUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  title="Ouvrir cette adresse dans un nouvel onglet pour la tester"
                >
                  <span>Tester le lien</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. RÉGLAGES DENSITÉ & CORRECTION D'ERREUR */}
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> 2. Densité & Taille des Carrés
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {errorLevel === 'L' ? '✓ Idéal Gravure Laser (Gros pavés)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setErrorLevel('L')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  errorLevel === 'L'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>Ultra Épuré (Niveau L)</span>
                  <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded">Gros pavés</span>
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  7% redondance. Pavés larges et espacés, idéal sur petit jeton de ~20mm.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setErrorLevel('M')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  errorLevel === 'M'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>Standard (Niveau M)</span>
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded">Équilibré</span>
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  15% redondance. Standard pour pièces moyennes (30mm+) ou impression papier.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setErrorLevel('H')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  errorLevel === 'H'
                    ? 'bg-red-500/20 border-red-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-red-300 flex items-center justify-between">
                  <span>Très Dense (Niveau H)</span>
                  <span className="text-[10px] bg-red-500/30 px-1.5 py-0.5 rounded">Plus fin</span>
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  30% redondance. Nombreux petits carrés, recommandé pour grande découpe.
                </div>
              </button>
            </div>
          </div>

          {/* 3. COMPENSATION FAISCEAU LASER (KERF OFFSET & ANTI-BAVURE) */}
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> 3. Réglages Anti-Bavure Faisceau Laser (Kerf)
              </h3>
              <span className="text-[10px] text-amber-300 font-mono">
                {kerfOffsetPercent}% d'espacement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kerf module shrink slider */}
              <div>
                <div className="flex justify-between text-[11px] text-white/70 mb-1">
                  <span>Espacement anti-fusion laser :</span>
                  <span className="font-mono text-amber-400 font-bold">{kerfOffsetPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={1}
                  value={kerfOffsetPercent}
                  onChange={(e) => setKerfOffsetPercent(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Rétrécit légèrement les carrés dans le fichier SVG pour compenser la largeur de brûlure du laser.
                </p>
              </div>

              {/* Quiet Zone Margin */}
              <div>
                <label className="block text-[11px] text-white/70 mb-1">
                  Marge blanche (Quiet zone) :
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 module (Ultra compact)</option>
                  <option value={2}>2 modules (Recommandé pour jeton)</option>
                  <option value={4}>4 modules (Standard large)</option>
                </select>
                <p className="text-[10px] text-white/40 mt-1">
                  Espace vide autour du QR code.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons for LightBurn & Export */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* SVG Download (Crucial for LightBurn) */}
              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!svgString || isGenerating}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Télécharger SVG (LightBurn)</span>
              </button>

              {/* PNG HD Download */}
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!pngDataUrl || isGenerating}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger PNG ({pngResolution}px)</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopySvg}
                className="flex-1 bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 hover:text-white py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Code SVG copié !' : 'Copier le code SVG vectoriel'}</span>
              </button>

              {onScanSimulate && (
                <button
                  type="button"
                  onClick={() => onScanSimulate(encodedUrl)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2.5 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Simuler un scan en direct pour tester l'analytics"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tester le scan (Analytics)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Direct Vector Visual & Laser Feasibility Check */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                Rendu Vectoriel Pur ({matrixSize}×{matrixSize})
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                {matrixSize <= 25 ? '🟢 Aucun risque bavure' : '🟡 Dense'}
              </span>
            </div>

            {/* Pure QR Display Container */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl flex items-center justify-center max-w-[280px] w-full aspect-square border border-gray-300">
              {svgString ? (
                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: svgString }}
                />
              ) : (
                <div className="text-xs text-black/50 animate-pulse">Génération...</div>
              )}
            </div>

            {/* Real Laser Diagnostics */}
            <div className="mt-5 w-full pt-4 border-t border-white/10 space-y-2 text-[11px] text-white/70">
              <div className="flex justify-between font-mono">
                <span>Nombre de carrés :</span>
                <strong className="text-white">{matrixSize} × {matrixSize} ({totalModulesCount} carrés)</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span>Taille réelle sur ~{tokenEngraveAreaMm}mm :</span>
                <strong className="text-emerald-400 font-bold">~{moduleSizeMm} mm / pavé</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span>Espacement anti-bavure :</span>
                <strong className="text-amber-300">{kerfOffsetPercent > 0 ? `${kerfOffsetPercent}% de dégagement` : '0% (Standard)'}</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span>Destination :</span>
                <span className="text-white truncate max-w-[180px]">{encodedUrl}</span>
              </div>
            </div>
          </div>

          {/* Laser Guide */}
          <div className="bg-black/30 border border-white/10 p-4 rounded-xl text-xs space-y-2 text-white/70">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Conseils pour la gravure laser sur jeton :
            </div>
            <ul className="space-y-1.5 text-[11px] text-white/60 list-disc list-inside">
              <li>L'adresse directe <strong className="text-white">plaquiste-arcachon.fr</strong> est courte et produit une matrice compacte <strong className="text-emerald-300">25×25 ou 29×29</strong>.</li>
              <li>Chaque pavé mesure <strong className="text-emerald-300">~0.70 à 0.90 mm</strong> sur un jeton standard, garantissant un scan instantané même usé.</li>
              <li>Importez directement le fichier <strong className="text-amber-300">SVG</strong> dans <strong>LightBurn</strong> : les chemins vectoriels sont pré-calculés avec la compensation anti-bavure.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
