import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart3, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Search, 
  Trash2, 
  Download, 
  RefreshCw, 
  Tag, 
  Sparkles,
  MapPin,
  Globe,
  ExternalLink,
  Wifi,
  Radio,
  Plus
} from 'lucide-react';
import { detectDeviceInfo, fetchVisitorLocation } from '../utils/visitorTracker';

export interface CaddieScanRecord {
  id: string;
  source: string;
  rawUrl?: string;
  path?: string;
  device?: 'Mobile' | 'Tablet' | 'Desktop';
  browser?: string;
  os?: string;
  screen?: string;
  city?: string;
  region?: string;
  department?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  referrer?: string;
  createdAt?: any;
}

const PRESET_TEST_CITIES = [
  { city: 'Arcachon', postalCode: '33120', department: 'Gironde (33)', lat: 44.6586, lng: -1.1648, label: '📍 Arcachon (33120)' },
  { city: 'La Teste-de-Buch', postalCode: '33260', department: 'Gironde (33)', lat: 44.6317, lng: -1.1444, label: '📍 La Teste-de-Buch (33260)' },
  { city: 'Gujan-Mestras', postalCode: '33470', department: 'Gironde (33)', lat: 44.6361, lng: -1.0722, label: '📍 Gujan-Mestras (33470)' },
  { city: 'Biganos', postalCode: '33380', department: 'Gironde (33)', lat: 44.6433, lng: -0.9786, label: '📍 Biganos (33380)' },
  { city: 'Andernos-les-Bains', postalCode: '33510', department: 'Gironde (33)', lat: 44.7431, lng: -1.1039, label: '📍 Andernos-les-Bains (33510)' },
  { city: 'Lège-Cap-Ferret', postalCode: '33950', department: 'Gironde (33)', lat: 44.6186, lng: -1.2464, label: '📍 Lège-Cap-Ferret (33950)' },
  { city: 'Bordeaux', postalCode: '33000', department: 'Gironde (33)', lat: 44.8378, lng: -0.5792, label: '📍 Bordeaux (33000)' },
];

export default function CaddieAnalyticsWidget() {
  const [scans, setScans] = useState<CaddieScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [simulating, setSimulating] = useState(false);
  const [selectedSimCity, setSelectedSimCity] = useState<string>('auto');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Clear feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Real-time Firestore sync
  useEffect(() => {
    const qScans = query(collection(db, 'caddie_scans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      qScans,
      (snapshot) => {
        const records: CaddieScanRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any)
        }));
        setScans(records);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur écoute scans Firestore:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute Analytics Metrics
  const metrics = useMemo(() => {
    const total = scans.length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let mobileCount = 0;
    let girondeCount = 0;

    const sourceCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = { Mobile: 0, Tablet: 0, Desktop: 0 };
    const dailyCounts: Record<string, number> = {};

    // Initialize last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      dailyCounts[dateStr] = 0;
    }

    scans.forEach((scan) => {
      // Date parsing
      let scanTime = 0;
      if (scan.createdAt?.toDate) {
        scanTime = scan.createdAt.toDate().getTime();
      } else if (typeof scan.createdAt === 'string') {
        scanTime = new Date(scan.createdAt).getTime();
      } else if (scan.createdAt?.seconds) {
        scanTime = scan.createdAt.seconds * 1000;
      }

      if (scanTime >= todayStart) todayCount++;
      if (scanTime >= sevenDaysAgo) weekCount++;
      if (scanTime >= thirtyDaysAgo) monthCount++;

      // Daily chart for last 7 days
      if (scanTime >= sevenDaysAgo) {
        const scanDate = new Date(scanTime);
        const dateStr = scanDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        }
      }

      // Device
      const dev = scan.device || 'Mobile';
      if (dev === 'Mobile') mobileCount++;
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      // Source / Tag
      const src = (scan.source || 'jeton').toLowerCase();
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // City / Geolocation
      const city = scan.city || 'Arcachon';
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      // Check Gironde / Bassin d'Arcachon
      const isGironde = (scan.postalCode && scan.postalCode.startsWith('33')) ||
                        (scan.department && scan.department.includes('33')) ||
                        ['arcachon', 'la teste', 'gujan', 'biganos', 'andernos', 'bordeaux', 'le teich', 'audenge', 'lanton', 'arès', 'ège-cap-ferret', 'mios', 'salles'].some(k => city.toLowerCase().includes(k));
      if (isGironde) {
        girondeCount++;
      }
    });

    const mobilePercentage = total > 0 ? Math.round((mobileCount / total) * 100) : 100;
    const girondePercentage = total > 0 ? Math.round((girondeCount / total) * 100) : 100;

    // Top Source
    const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
    const topSource = sortedSources.length > 0 ? sortedSources[0] : ['jeton', 0];

    // Top Cities
    const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

    return {
      total,
      todayCount,
      weekCount,
      monthCount,
      mobileCount,
      mobilePercentage,
      girondeCount,
      girondePercentage,
      sourceCounts: sortedSources,
      cityCounts: sortedCities,
      deviceCounts,
      dailyCounts: Object.entries(dailyCounts),
      topSource: topSource[0],
      topSourceCount: topSource[1]
    };
  }, [scans]);

  // Filtered scans for the list view
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const matchesSource = sourceFilter === 'all' || (scan.source || 'jeton').toLowerCase() === sourceFilter.toLowerCase();
      if (!matchesSource) return false;

      const matchesCity = cityFilter === 'all' || (scan.city || 'Arcachon').toLowerCase() === cityFilter.toLowerCase();
      if (!matchesCity) return false;

      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      const matchText = [
        scan.source,
        scan.city,
        scan.postalCode,
        scan.department,
        scan.region,
        scan.isp,
        scan.device,
        scan.os,
        scan.browser,
        scan.path,
        scan.referrer
      ].filter(Boolean).join(' ').toLowerCase();

      return matchText.includes(q);
    });
  }, [scans, searchFilter, sourceFilter, cityFilter]);

  // Format relative time helper in French
  const getRelativeTime = (createdAt: any) => {
    if (!createdAt) return 'À l\'instant';
    let date: Date;
    if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }

    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Il y a quelques secondes';
    if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 172800) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Format exact date
  const getExactDate = (createdAt: any) => {
    if (!createdAt) return '-';
    let date: Date;
    if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Simulate a live test scan directly from admin with selected City
  const handleSimulateScan = async (sourceTag = 'jeton') => {
    try {
      setSimulating(true);
      const devInfo = detectDeviceInfo();
      
      let geoInfo: any;
      if (selectedSimCity === 'auto') {
        geoInfo = await fetchVisitorLocation();
      } else {
        const preset = PRESET_TEST_CITIES.find(p => p.city === selectedSimCity) || PRESET_TEST_CITIES[0];
        geoInfo = {
          city: preset.city,
          region: 'Nouvelle-Aquitaine',
          department: preset.department,
          postalCode: preset.postalCode,
          country: 'France',
          countryCode: 'FR',
          latitude: preset.lat,
          longitude: preset.lng,
          isp: 'Simulation Test 4G'
        };
      }

      await addDoc(collection(db, 'caddie_scans'), {
        source: sourceTag,
        rawUrl: `${window.location.origin}/?ref=${sourceTag}`,
        path: '/',
        device: devInfo.device,
        browser: devInfo.browser,
        os: devInfo.os,
        screen: devInfo.screen,
        city: geoInfo.city,
        region: geoInfo.region,
        department: geoInfo.department,
        postalCode: geoInfo.postalCode,
        country: geoInfo.country,
        countryCode: geoInfo.countryCode,
        latitude: geoInfo.latitude || null,
        longitude: geoInfo.longitude || null,
        isp: geoInfo.isp || 'Test Admin',
        referrer: 'Test Simulation Admin',
        createdAt: serverTimestamp()
      });
      setFeedback(`Scan de test enregistré pour "${geoInfo.city} (${geoInfo.postalCode})" avec ?ref=${sourceTag} !`);
    } catch (error) {
      console.error('Erreur simulation scan:', error);
      setFeedback('Erreur lors de la simulation du scan.');
    } finally {
      setSimulating(false);
    }
  };

  // Delete single scan
  const handleDeleteScan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'caddie_scans', id));
      setFeedback('Passage supprimé de l\'historique.');
    } catch (error) {
      console.error('Erreur suppression scan:', error);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (scans.length === 0) return;
    const headers = [
      'ID', 
      'Date & Heure', 
      'Source (Campagne)', 
      'Ville', 
      'Code Postal', 
      'Département / Région', 
      'Pays', 
      'Opérateur (ISP)', 
      'Appareil', 
      'OS', 
      'Navigateur', 
      'Page', 
      'Provenance'
    ];
    
    const rows = scans.map((s) => [
      s.id,
      getExactDate(s.createdAt),
      s.source || 'jeton',
      s.city || 'Arcachon',
      s.postalCode || '33120',
      s.department || s.region || 'Gironde (33)',
      s.country || 'France',
      s.isp || '',
      s.device || 'Mobile',
      s.os || 'Inconnu',
      s.browser || 'Inconnu',
      s.path || '/',
      s.referrer || 'Direct'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-jetons-localises-parat-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDeviceIcon = (device?: string) => {
    if (device === 'Desktop') return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
    if (device === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Smartphone className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-md text-white mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl tracking-wide uppercase text-amber-300 font-light font-serif flex items-center gap-2">
                <span>Analytics & Géolocalisation des Scans</span>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-normal">
                  📍 Villes & Bassin d'Arcachon
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Suivi en direct des scans QR (villes, Bassin d'Arcachon, départements, appareils et campagnes).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Simulation with City choice */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset city selector for quick testing */}
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1" />
            <select
              value={selectedSimCity}
              onChange={(e) => setSelectedSimCity(e.target.value)}
              className="bg-transparent text-xs text-white/90 focus:outline-none pr-2 py-1 cursor-pointer font-mono"
              title="Choisir la ville de simulation"
            >
              <option value="auto" className="bg-[#1c1c1c] text-white">⚡ Détection IP automatique</option>
              {PRESET_TEST_CITIES.map((c) => (
                <option key={c.city} value={c.city} className="bg-[#1c1c1c] text-white">{c.label}</option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => handleSimulateScan('jeton')}
              disabled={simulating}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 ml-1"
              title="Enregistrer un scan de test"
            >
              <Plus className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>Simuler scan</span>
            </button>
          </div>

          {scans.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Exporter au format CSV / Excel avec villes et codes postaux"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Scans */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Total Scans Jetons</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-white font-light">
            {metrics.total}
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Tous passages enregistrés
          </p>
        </div>

        {/* Local Bassin d'Arcachon / Gironde */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Bassin & Gironde (33)</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-emerald-300 font-light">
            {metrics.girondePercentage}%
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
            {metrics.girondeCount} scans locaux 33
          </p>
        </div>

        {/* 7 Days Trend */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Activité 7 Jours</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-blue-300 font-light">
            {metrics.weekCount}
          </div>
          <p className="text-[11px] text-white/50 mt-1">
            {metrics.todayCount} aujourd'hui
          </p>
        </div>

        {/* Mobile / Smartphone Ratio */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Smartphones (QR)</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-purple-300 font-light">
            {metrics.mobilePercentage}%
          </div>
          <p className="text-[11px] text-white/50 mt-1">
            {metrics.mobileCount} scans mobiles
          </p>
        </div>
      </div>

      {/* NEW GEOLOCATION BLOCK: Top Villes & Répartition Géographique */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Top Villes Identifiées */}
        <div className="lg:col-span-7 bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> 
              Top Villes & Localisation des Scans
            </h3>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-white/70">
              {metrics.cityCounts.length} {metrics.cityCounts.length > 1 ? 'villes' : 'ville'}
            </span>
          </div>

          {metrics.cityCounts.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/40 italic">
              Aucune donnée de localisation pour l'instant. Effectuez un scan pour voir apparaître les villes !
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {metrics.cityCounts.slice(0, 6).map(([cityName, count], idx) => {
                const percent = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                const isTop1 = idx === 0;

                return (
                  <div key={cityName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                          isTop1 ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/70'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {cityName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white/60 text-[11px]">{count} {count > 1 ? 'scans' : 'scan'}</span>
                        <span className={`font-bold ${isTop1 ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {percent}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop1 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-300' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Bassin d'Arcachon & Gironde Visual Focus */}
        <div className="lg:col-span-5 bg-black/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> 
                Périmètre Bassin d'Arcachon
              </h3>
              <span className="text-[10px] text-emerald-300 font-mono">
                {metrics.girondePercentage}% Local
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-3">
              Répartition des scans par secteur géographique sur votre zone d'intervention :
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="text-[10px] uppercase text-amber-300/80 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Sud Bassin
                </div>
                <div className="text-[11px] text-white/60">
                  Arcachon, La Teste, Gujan, Le Teich
                </div>
              </div>

              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="text-[10px] uppercase text-emerald-300/80 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Nord Bassin
                </div>
                <div className="text-[11px] text-white/60">
                  Lège-Cap-Ferret, Arès, Andernos
                </div>
              </div>

              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="text-[10px] uppercase text-blue-300/80 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Coeur de Bassin
                </div>
                <div className="text-[11px] text-white/60">
                  Biganos, Mios, Marcheprime
                </div>
              </div>

              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="text-[10px] uppercase text-purple-300/80 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Bordeaux Métropole
                </div>
                <div className="text-[11px] text-white/60">
                  Bordeaux, Pessac, Mérignac
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              Géolocalisation IP transparente (100% automatique, sans popup GPS)
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown & Mini Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Daily Mini-Bar Chart (7 days) */}
        <div className="lg:col-span-7 bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Activité récente (7 derniers jours)
            </h3>
            <span className="text-[10px] text-white/50">Mise à jour en direct</span>
          </div>

          <div className="pt-4 flex items-end justify-between gap-2 h-36 px-2 border-b border-white/10 pb-2">
            {metrics.dailyCounts.map(([dayName, count]) => {
              const maxCount = Math.max(...metrics.dailyCounts.map(([, c]) => c), 1);
              const heightPercent = Math.max(Math.round((count / maxCount) * 100), 8);

              return (
                <div key={dayName} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-white/80 group-hover:text-amber-300 transition-colors font-bold">
                    {count}
                  </span>
                  <div className="w-full max-w-[32px] bg-white/10 group-hover:bg-amber-500/80 rounded-t-md transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/40 to-transparent" />
                  </div>
                  <span className="text-[9px] uppercase font-mono text-white/50 group-hover:text-white transition-colors truncate">
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source & Device Breakdown */}
        <div className="lg:col-span-5 bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Répartition par Campagne / Tag
            </h3>

            {metrics.sourceCounts.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40 italic">
                Aucun scan enregistré pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                {metrics.sourceCounts.slice(0, 4).map(([src, count]) => {
                  const percent = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={src} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/90 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          ?ref={src}
                        </span>
                        <span className="text-amber-300 font-bold">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile : {metrics.deviceCounts.Mobile || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>PC : {metrics.deviceCounts.Desktop || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Tablet className="w-3.5 h-3.5 text-purple-400" />
              <span>Tablette : {metrics.deviceCounts.Tablet || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Live Feed / Scan Log */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              Historique des Derniers Passages avec Localisation ({filteredScans.length})
            </h3>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by City */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Toutes les villes</option>
              {metrics.cityCounts.map(([cityName]) => (
                <option key={cityName} value={cityName}>📍 {cityName}</option>
              ))}
            </select>

            {/* Filter by source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Toutes sources</option>
              {metrics.sourceCounts.map(([src]) => (
                <option key={src} value={src}>ref={src}</option>
              ))}
            </select>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher ville, code postal, appareil..."
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Scan Records List */}
        {loading ? (
          <div className="text-center py-10 text-xs text-white/40 animate-pulse">
            Chargement des statistiques...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40 italic bg-black/20 rounded-xl border border-white/5">
            Aucun scan correspondant. Scannez un jeton ou cliquez sur "Simuler scan" ci-dessus pour tester !
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredScans.map((scan) => {
              const cityName = scan.city || 'Arcachon';
              const postal = scan.postalCode || '33120';
              const mapsQuery = scan.latitude && scan.longitude 
                ? `${scan.latitude},${scan.longitude}` 
                : `${cityName}, France`;

              return (
                <div
                  key={scan.id}
                  className="p-3.5 bg-black/50 hover:bg-black/70 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
                >
                  {/* Left: Device & Source Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 shrink-0">
                      {getDeviceIcon(scan.device)}
                    </div>
                    <div>
                      {/* Top line: Source tag + City Badge + Device */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                          ?ref={scan.source || 'jeton'}
                        </span>

                        {/* Location Badge */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-semibold transition-colors"
                          title="Voir la localisation sur Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{cityName}</span>
                          {postal && <span className="text-emerald-400/80">({postal})</span>}
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </a>

                        <span className="text-xs font-semibold text-white">
                          {scan.device || 'Mobile'} ({scan.os || 'OS inconnu'} • {scan.browser || 'Navigateur'})
                        </span>
                      </div>

                      {/* Sub-line: Additional details */}
                      <div className="text-[11px] text-white/50 flex items-center gap-2 mt-1 flex-wrap">
                        {scan.department && (
                          <span className="text-white/70">{scan.department}</span>
                        )}
                        {scan.isp && (
                          <>
                            <span>•</span>
                            <span className="text-white/60 flex items-center gap-1">
                              <Wifi className="w-3 h-3 text-blue-400" />
                              {scan.isp}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Page : <code className="text-white/70">{scan.path || '/'}</code></span>
                        <span>•</span>
                        <span className="truncate max-w-[180px] text-white/40">{scan.referrer || 'Direct / QR'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="text-xs font-medium text-amber-300/90 block">
                        {getRelativeTime(scan.createdAt)}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 block">
                        {getExactDate(scan.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteScan(scan.id)}
                      className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer ce passage de l'historique"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
