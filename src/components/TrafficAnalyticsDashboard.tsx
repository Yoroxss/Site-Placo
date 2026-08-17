import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Activity,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Trash2,
  Download,
  Filter,
  Eye,
  MousePointerClick,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  FileCheck,
  Compass,
  Wifi,
  Radio,
  ArrowUpRight,
  BarChart2,
  PieChart,
  UserCheck,
  Zap,
  Plus
} from 'lucide-react';
import { detectDeviceInfo, fetchVisitorLocation } from '../utils/visitorTracker';

export interface SiteVisitRecord {
  id: string;
  sessionId?: string;
  page: string;
  pageTitle?: string;
  referrer?: string;
  referrerUrl?: string;
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
  campaign?: string;
  action?: string;
  durationSec?: number;
  isNewVisitor?: boolean;
  createdAt?: any;
}

type TimeframeOption = 'all' | 'today' | '7days' | '30days';

const PRESET_TEST_PAGES = [
  { path: '/', title: 'Accueil - Plâtrerie Bassin d\'Arcachon' },
  { path: '/artisan-plaquiste/arcachon', title: 'Artisan Plaquiste Arcachon' },
  { path: '/artisan-plaquiste/la-teste-de-buch', title: 'Artisan Plaquiste La Teste' },
  { path: '/artisan-plaquiste/gujan-mestras', title: 'Artisan Plaquiste Gujan' },
  { path: '/artisan-plaquiste/le-teich', title: 'Artisan Plaquiste Le Teich' },
  { path: '/artisan-plaquiste/biganos', title: 'Artisan Plaquiste Biganos' },
  { path: '/artisan-plaquiste/lege-cap-ferret', title: 'Artisan Plaquiste Lège-Cap-Ferret' },
  { path: '/blog', title: 'Blog & Conseils Techniques' },
  { path: '/mentions-legales', title: 'Mentions Légales' },
];

const PRESET_TEST_CITIES = [
  { city: 'Arcachon', postalCode: '33120', department: 'Gironde (33)', lat: 44.6586, lng: -1.1648 },
  { city: 'Le Teich', postalCode: '33470', department: 'Gironde (33)', lat: 44.6344, lng: -1.0222 },
  { city: 'La Teste-de-Buch', postalCode: '33260', department: 'Gironde (33)', lat: 44.6317, lng: -1.1444 },
  { city: 'Gujan-Mestras', postalCode: '33470', department: 'Gironde (33)', lat: 44.6361, lng: -1.0722 },
  { city: 'Biganos', postalCode: '33380', department: 'Gironde (33)', lat: 44.6433, lng: -0.9786 },
  { city: 'Andernos-les-Bains', postalCode: '33510', department: 'Gironde (33)', lat: 44.7431, lng: -1.1039 },
  { city: 'Lège-Cap-Ferret', postalCode: '33950', department: 'Gironde (33)', lat: 44.6186, lng: -1.2464 },
  { city: 'Bordeaux', postalCode: '33000', department: 'Gironde (33)', lat: 44.8378, lng: -0.5792 },
];

export default function TrafficAnalyticsDashboard() {
  const [visits, setVisits] = useState<SiteVisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7days');
  const [searchFilter, setSearchFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [referrerFilter, setReferrerFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simCity, setSimCity] = useState(PRESET_TEST_CITIES[0].city);
  const [simPage, setSimPage] = useState(PRESET_TEST_PAGES[0].path);

  // Clear feedback after 4.5s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Real-time Firestore sync
  useEffect(() => {
    const qVisits = query(collection(db, 'site_visits'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      qVisits,
      (snapshot) => {
        const records: SiteVisitRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any)
        }));
        setVisits(records);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur écoute trafic site:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Time-filtered visits
  const timeFilteredVisits = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return visits.filter((v) => {
      let visitTime = 0;
      if (v.createdAt?.toDate) {
        visitTime = v.createdAt.toDate().getTime();
      } else if (typeof v.createdAt === 'string') {
        visitTime = new Date(v.createdAt).getTime();
      } else if (v.createdAt?.seconds) {
        visitTime = v.createdAt.seconds * 1000;
      } else {
        visitTime = now;
      }

      if (timeframe === 'today') return visitTime >= todayStart;
      if (timeframe === '7days') return visitTime >= sevenDaysAgo;
      if (timeframe === '30days') return visitTime >= thirtyDaysAgo;
      return true;
    });
  }, [visits, timeframe]);

  // Aggregate Traffic Metrics
  const metrics = useMemo(() => {
    const totalPageviews = timeFilteredVisits.length;
    const sessionIds = new Set<string>();
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;
    let girondeCount = 0;
    let newVisitorsCount = 0;
    let directCount = 0;
    let googleCount = 0;
    let caddieCount = 0;
    let socialCount = 0;
    let phoneActionCount = 0;
    let quoteActionCount = 0;

    const pageCounts: Record<string, { count: number; title: string }> = {};
    const cityCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};
    const hourlyCounts: number[] = new Array(24).fill(0);

    // Active in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let activeNowCount = 0;

    // Initialize 7 days if in 7days or today
    const daysToShow = timeframe === 'today' ? 1 : timeframe === '30days' ? 14 : 7;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(todayStart - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      dailyCounts[dateStr] = 0;
    }

    timeFilteredVisits.forEach((v) => {
      let visitTime = 0;
      if (v.createdAt?.toDate) {
        visitTime = v.createdAt.toDate().getTime();
      } else if (typeof v.createdAt === 'string') {
        visitTime = new Date(v.createdAt).getTime();
      } else if (v.createdAt?.seconds) {
        visitTime = v.createdAt.seconds * 1000;
      }

      if (visitTime >= fiveMinutesAgo) {
        activeNowCount++;
      }

      const sId = v.sessionId || `anon_${visitTime}`;
      sessionIds.add(sId);

      if (v.isNewVisitor) newVisitorsCount++;

      // Daily grouping
      const d = new Date(visitTime);
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      } else if (timeframe === 'all' || timeframe === '30days') {
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }

      // Hourly grouping
      const hour = d.getHours();
      if (hour >= 0 && hour < 24) {
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }

      // Device breakdown
      const dev = v.device || 'Mobile';
      if (dev === 'Mobile') mobileCount++;
      else if (dev === 'Tablet') tabletCount++;
      else desktopCount++;

      // OS & Browser
      const os = v.os || 'Inconnu';
      osCounts[os] = (osCounts[os] || 0) + 1;

      const browser = v.browser || 'Inconnu';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;

      // Page breakdown
      const pagePath = v.page || '/';
      const pageTitle = v.pageTitle || pagePath;
      if (!pageCounts[pagePath]) {
        pageCounts[pagePath] = { count: 0, title: pageTitle };
      }
      pageCounts[pagePath].count++;

      // City & Gironde
      const city = v.city || 'Arcachon';
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      const isGironde =
        (v.postalCode && v.postalCode.startsWith('33')) ||
        (v.department && v.department.includes('33')) ||
        ['arcachon', 'la teste', 'gujan', 'le teich', 'biganos', 'andernos', 'bordeaux', 'audenge', 'lanton', 'arès', 'ège-cap-ferret', 'mios', 'salles'].some((k) =>
          city.toLowerCase().includes(k)
        );
      if (isGironde) girondeCount++;

      // Referrers
      const ref = v.referrer || 'Direct / QR';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

      if (ref === 'Google SEO') googleCount++;
      else if (ref === 'Jeton Caddie' || v.campaign) caddieCount++;
      else if (ref === 'Instagram' || ref === 'Facebook') socialCount++;
      else if (ref.includes('Direct')) directCount++;

      // Actions
      if (v.action?.includes('call') || v.pageTitle?.includes('call')) phoneActionCount++;
      if (v.action?.includes('quote') || v.pageTitle?.includes('quote')) quoteActionCount++;
    });

    const uniqueSessions = sessionIds.size;
    const pagesPerSession = uniqueSessions > 0 ? (totalPageviews / uniqueSessions).toFixed(1) : '1.0';
    const mobileRatio = totalPageviews > 0 ? Math.round((mobileCount / totalPageviews) * 100) : 0;
    const girondeRatio = totalPageviews > 0 ? Math.round((girondeCount / totalPageviews) * 100) : 0;
    const newVisitorsRatio = totalPageviews > 0 ? Math.round((newVisitorsCount / totalPageviews) * 100) : 75;

    // Sorted rankings
    const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1].count - a[1].count);
    const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
    const sortedReferrers = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]);
    const sortedOs = Object.entries(osCounts).sort((a, b) => b[1] - a[1]);
    const sortedBrowsers = Object.entries(browserCounts).sort((a, b) => b[1] - a[1]);

    return {
      totalPageviews,
      uniqueSessions,
      pagesPerSession,
      activeNowCount,
      mobileCount,
      desktopCount,
      tabletCount,
      mobileRatio,
      girondeCount,
      girondeRatio,
      newVisitorsRatio,
      googleCount,
      caddieCount,
      socialCount,
      directCount,
      phoneActionCount,
      quoteActionCount,
      sortedPages,
      sortedCities,
      sortedReferrers,
      sortedOs,
      sortedBrowsers,
      dailyCounts: Object.entries(dailyCounts),
      hourlyCounts
    };
  }, [timeFilteredVisits, timeframe]);

  // Filtered visits for the live table list
  const filteredVisits = useMemo(() => {
    return timeFilteredVisits.filter((visit) => {
      if (deviceFilter !== 'all' && visit.device !== deviceFilter) return false;
      if (cityFilter !== 'all' && (visit.city || 'Arcachon').toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (pageFilter !== 'all' && (visit.page || '/') !== pageFilter) return false;
      if (referrerFilter !== 'all' && (visit.referrer || 'Direct / QR') !== referrerFilter) return false;

      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      const searchable = [
        visit.page,
        visit.pageTitle,
        visit.city,
        visit.postalCode,
        visit.department,
        visit.region,
        visit.referrer,
        visit.referrerUrl,
        visit.campaign,
        visit.device,
        visit.os,
        visit.browser,
        visit.isp,
        visit.action
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [timeFilteredVisits, deviceFilter, cityFilter, pageFilter, referrerFilter, searchFilter]);

  // Format relative time helper
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
    if (diffSec < 45) return 'Il y a un instant';
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

  // Delete visit
  const handleDeleteVisit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'site_visits', id));
      setFeedback('Visite retirée de l\'historique.');
    } catch (err) {
      console.error(err);
      setFeedback('Erreur lors de la suppression.');
    }
  };

  // Clear all visits
  const handleClearAllVisits = async () => {
    if (!window.confirm('Voulez-vous vraiment effacer tout l\'historique des visites enregistrées ?')) return;
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'site_visits'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setFeedback('Historique des visites réinitialisé.');
    } catch (err) {
      console.error(err);
      setFeedback('Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate test visit
  const handleSimulateVisit = async () => {
    try {
      setSimulating(true);
      const devInfo = detectDeviceInfo();
      const presetCity = PRESET_TEST_CITIES.find((c) => c.city === simCity) || PRESET_TEST_CITIES[0];
      const presetPage = PRESET_TEST_PAGES.find((p) => p.path === simPage) || PRESET_TEST_PAGES[0];

      await addDoc(collection(db, 'site_visits'), {
        sessionId: `test_${Date.now()}`,
        page: presetPage.path,
        pageTitle: presetPage.title,
        referrer: 'Simulation Visite Test',
        referrerUrl: 'https://google.fr/search?q=plaquiste+arcachon',
        device: devInfo.device,
        browser: devInfo.browser,
        os: devInfo.os,
        screen: devInfo.screen,
        city: presetCity.city,
        region: 'Nouvelle-Aquitaine',
        department: presetCity.department,
        postalCode: presetCity.postalCode,
        country: 'France',
        countryCode: 'FR',
        latitude: presetCity.lat,
        longitude: presetCity.lng,
        isp: 'Simulation Visiteur',
        action: 'pageview',
        durationSec: Math.floor(Math.random() * 90) + 15,
        isNewVisitor: true,
        createdAt: serverTimestamp()
      });

      setFeedback(`Visite de test simulée sur "${presetPage.title}" depuis ${presetCity.city} (${presetCity.postalCode}) !`);
    } catch (err) {
      console.error(err);
      setFeedback('Erreur lors de la simulation de visite.');
    } finally {
      setSimulating(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (visits.length === 0) return;
    const headers = [
      'ID Visite',
      'Date & Heure',
      'Page Consultée',
      'Titre Page',
      'Source / Référent',
      'URL Référente / Campagne',
      'Ville',
      'Code Postal',
      'Département',
      'Région',
      'Pays',
      'Opérateur (ISP)',
      'Appareil',
      'OS',
      'Navigateur',
      'Écran',
      'Action',
      'Nouveau Visiteur'
    ];

    const rows = visits.map((v) => [
      v.id,
      getExactDate(v.createdAt),
      v.page || '/',
      v.pageTitle || '',
      v.referrer || 'Direct',
      v.referrerUrl || v.campaign || '',
      v.city || 'Arcachon',
      v.postalCode || '33120',
      v.department || 'Gironde (33)',
      v.region || 'Nouvelle-Aquitaine',
      v.country || 'France',
      v.isp || '',
      v.device || 'Mobile',
      v.os || 'Inconnu',
      v.browser || 'Inconnu',
      v.screen || '',
      v.action || 'pageview',
      v.isNewVisitor ? 'Oui' : 'Non'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trafic-circulation-site-parat-bouey-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDeviceIcon = (device?: string) => {
    if (device === 'Desktop') return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
    if (device === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Smartphone className="w-3.5 h-3.5 text-amber-400" />;
  };

  const getReferrerBadge = (referrer?: string) => {
    const ref = referrer || 'Direct / QR';
    if (ref.includes('Google')) {
      return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">🔍 Google SEO</span>;
    }
    if (ref.includes('Jeton') || ref.includes('Campagne')) {
      return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">🛒 Jeton Caddie</span>;
    }
    if (ref.includes('Instagram') || ref.includes('Facebook')) {
      return <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-mono">📱 Réseau Social</span>;
    }
    if (ref.includes('PagesJaunes') || ref.includes('LeBonCoin')) {
      return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-mono">📂 Annuaire Pro</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10 text-[10px] font-mono">🌐 Accès Direct / QR</span>;
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header & Global Controls */}
      <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl tracking-wide uppercase text-amber-300 font-light font-serif flex items-center gap-2 flex-wrap">
                  <span>Circulation & Trafic du Site</span>
                  {metrics.activeNowCount > 0 ? (
                    <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {metrics.activeNowCount} {metrics.activeNowCount > 1 ? 'visiteurs actifs' : 'visiteur actif'} (5 min)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-white/10 border border-white/10 text-white/60 px-2 py-0.5 rounded-full font-mono">
                      🔴 En veille (0 actif en ce moment)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Suivi complet en direct : pages lues, origines (Google, Direct, Jetons...), villes, appareils et clics.
                </p>
              </div>
            </div>
          </div>

          {/* Timeframe Selector & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Tabs */}
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-1">
              {(
                [
                  { key: 'today', label: 'Aujourd\'hui' },
                  { key: '7days', label: '7 jours' },
                  { key: '30days', label: '30 jours' },
                  { key: 'all', label: 'Tout' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTimeframe(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeframe === tab.key
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            {visits.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="Exporter tout l'historique au format CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </button>
            )}

            {/* Clear All */}
            {visits.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllVisits}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Purger l'historique"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purger</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {feedback}
            </span>
            <button onClick={() => setFeedback(null)} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* Quick Simulator Tool */}
        <div className="mt-6 p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white/90">Testeur & Simulateur de Visite :</span>
            <span className="text-[11px] text-white/50">Simulez le passage d'un internaute pour vérifier la circulation en direct.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Page selection */}
            <select
              value={simPage}
              onChange={(e) => setSimPage(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/90 focus:outline-none focus:border-amber-500 font-mono"
            >
              {PRESET_TEST_PAGES.map((p) => (
                <option key={p.path} value={p.path}>📄 {p.path}</option>
              ))}
            </select>

            {/* City selection */}
            <select
              value={simCity}
              onChange={(e) => setSimCity(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/90 focus:outline-none focus:border-amber-500 font-mono"
            >
              {PRESET_TEST_CITIES.map((c) => (
                <option key={c.city} value={c.city}>📍 {c.city} ({c.postalCode})</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSimulateVisit}
              disabled={simulating}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>Simuler Visite</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Page Views */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Pages Vues</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-white font-light">
            {metrics.totalPageviews}
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {metrics.uniqueSessions} sessions uniques
          </p>
        </div>

        {/* Local Bassin & Gironde 33 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Trafic Local (33)</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-emerald-300 font-light">
            {metrics.girondeRatio}%
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            {metrics.girondeCount} visites Gironde & Bassin
          </p>
        </div>

        {/* Mobile Smartphones */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Smartphones (Mobile)</span>
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-blue-300 font-light">
            {metrics.mobileRatio}%
          </div>
          <p className="text-[11px] text-white/50 mt-1">
            {metrics.mobileCount} mobiles • {metrics.desktopCount} ordinateurs
          </p>
        </div>

        {/* Pages per session & interest */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Pages / Visiteur</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl md:text-4xl font-serif text-purple-300 font-light">
            {metrics.pagesPerSession}
          </div>
          <p className="text-[11px] text-purple-300/80 mt-1">
            {metrics.newVisitorsRatio}% nouveaux visiteurs
          </p>
        </div>
      </div>

      {/* Main Charts & Analytics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Timeline Activity Chart */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Évolution du Trafic ({timeframe === 'today' ? 'Aujourd\'hui' : timeframe === '7days' ? '7 derniers jours' : 'Période'})
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">Nombre de pages consultées au fil des jours</p>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-white/70">
              {metrics.totalPageviews} vues
            </span>
          </div>

          <div className="pt-6 flex items-end justify-between gap-2 h-44 px-2 border-b border-white/10 pb-2">
            {metrics.dailyCounts.map(([dayName, count]) => {
              const maxCount = Math.max(...metrics.dailyCounts.map(([, c]) => c), 1);
              const heightPercent = Math.max(Math.round((count / maxCount) * 100), 6);

              return (
                <div key={dayName} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-white/80 group-hover:text-amber-300 transition-colors font-bold">
                    {count}
                  </span>
                  <div
                    className="w-full max-w-[36px] bg-white/10 group-hover:bg-amber-500 rounded-t-md transition-all duration-300 relative overflow-hidden"
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

          {/* Hourly Traffic Peaks */}
          <div className="pt-3">
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold block mb-2">
              Affluence par tranche horaire (0h à 23h) :
            </span>
            <div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
              {metrics.hourlyCounts.map((hCount, h) => {
                const maxHour = Math.max(...metrics.hourlyCounts, 1);
                const opacity = hCount > 0 ? Math.max(hCount / maxHour, 0.25) : 0.05;
                return (
                  <div
                    key={h}
                    className="h-6 rounded bg-amber-500 flex items-center justify-center text-[8px] font-mono text-black font-bold relative group cursor-default"
                    style={{ opacity }}
                    title={`${h}h: ${hCount} visites`}
                  >
                    {hCount > 0 && <span>{hCount}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1 px-1">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </div>
        </div>

        {/* Acquisition Channels (Sources / Referrers) */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400" />
                Canaux d'Acquisition
              </h3>
            </div>
            <p className="text-[11px] text-white/50 mb-4">D'où arrivent vos visiteurs ?</p>

            {metrics.sortedReferrers.length === 0 ? (
              <div className="text-center py-8 text-xs text-white/40 italic">
                Aucune donnée de canal pour cette période.
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {metrics.sortedReferrers.map(([refName, count]) => {
                  const percent = metrics.totalPageviews > 0 ? Math.round((count / metrics.totalPageviews) * 100) : 0;
                  return (
                    <div key={refName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/90 font-medium truncate max-w-[170px]">
                          {refName}
                        </span>
                        <span className="text-amber-300 font-mono font-bold">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
              <div className="text-[10px] text-white/50">Google SEO</div>
              <div className="text-base font-serif text-blue-300 font-bold">{metrics.googleCount}</div>
            </div>
            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
              <div className="text-[10px] text-white/50">Jetons Caddies</div>
              <div className="text-base font-serif text-amber-300 font-bold">{metrics.caddieCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pages les plus consultées & Top Villes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Pages Consultées */}
        <div className="lg:col-span-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Pages les Plus Visitées
            </h3>
            <span className="text-[10px] text-white/50 font-mono">
              {metrics.sortedPages.length} {metrics.sortedPages.length > 1 ? 'pages' : 'page'}
            </span>
          </div>

          {metrics.sortedPages.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/40 italic">
              Aucune page enregistrée sur cette période.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {metrics.sortedPages.slice(0, 8).map(([path, data], idx) => {
                const percent = metrics.totalPageviews > 0 ? Math.round((data.count / metrics.totalPageviews) * 100) : 0;
                return (
                  <div key={path} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[75%]">
                        <span className="w-5 h-5 rounded bg-white/10 text-white/70 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-white font-medium truncate">{data.title || path}</div>
                          <div className="text-[10px] text-white/40 font-mono truncate">{path}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className="text-amber-300 font-bold">{data.count} vues</span>
                        <span className="text-[10px] text-white/50 block">({percent}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Villes & Répartition Géographique */}
        <div className="lg:col-span-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Origine Géographique des Visiteurs
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">
              {metrics.girondeRatio}% Bassin & 33
            </span>
          </div>

          {metrics.sortedCities.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/40 italic">
              Aucune donnée géographique disponible.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {metrics.sortedCities.slice(0, 8).map(([city, count], idx) => {
                const percent = metrics.totalPageviews > 0 ? Math.round((count / metrics.totalPageviews) * 100) : 0;
                return (
                  <div key={city} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white/10 text-white/70 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {city}
                        </span>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className="text-emerald-300 font-bold">{count} {count > 1 ? 'visites' : 'visite'}</span>
                        <span className="text-[10px] text-white/50 block">({percent}%)</span>
                      </div>
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
      </div>

      {/* Systèmes d'exploitation & Navigateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block">Système d'Exploitation (OS)</span>
          <div className="space-y-1.5">
            {metrics.sortedOs.slice(0, 3).map(([osName, c]) => (
              <div key={osName} className="flex justify-between text-xs font-mono">
                <span className="text-white/80">{osName}</span>
                <span className="text-amber-300 font-bold">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block">Navigateurs Web</span>
          <div className="space-y-1.5">
            {metrics.sortedBrowsers.slice(0, 3).map(([bName, c]) => (
              <div key={bName} className="flex justify-between text-xs font-mono">
                <span className="text-white/80">{bName}</span>
                <span className="text-blue-300 font-bold">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block">Appareils Détectés</span>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-amber-300">
              <span>📱 Smartphones</span>
              <span className="font-bold">{metrics.mobileCount}</span>
            </div>
            <div className="flex justify-between text-blue-300">
              <span>💻 Ordinateurs</span>
              <span className="font-bold">{metrics.desktopCount}</span>
            </div>
            <div className="flex justify-between text-purple-300">
              <span>📟 Tablettes</span>
              <span className="font-bold">{metrics.tabletCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block">Type de Visiteur</span>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-emerald-300">
              <span>✨ Nouveaux</span>
              <span className="font-bold">{metrics.newVisitorsRatio}%</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>🔄 Habitués</span>
              <span className="font-bold">{100 - metrics.newVisitorsRatio}%</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>📄 Pages / session</span>
              <span className="font-bold">{metrics.pagesPerSession}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream / Detailed Table of All Visits */}
      <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm md:text-base uppercase tracking-widest text-amber-300 font-semibold">
                Journal en Direct des Passages & Circulation ({filteredVisits.length})
              </h3>
              <p className="text-[11px] text-white/50">Historique détaillé de chaque page vue et action</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Page */}
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Toutes les pages</option>
              {metrics.sortedPages.map(([p]) => (
                <option key={p} value={p}>📄 {p}</option>
              ))}
            </select>

            {/* Filter by City */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Toutes les villes</option>
              {metrics.sortedCities.map(([c]) => (
                <option key={c} value={c}>📍 {c}</option>
              ))}
            </select>

            {/* Filter by Device */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Tous appareils</option>
              <option value="Mobile">📱 Mobile</option>
              <option value="Desktop">💻 PC</option>
              <option value="Tablet">📟 Tablette</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher page, ville, OS..."
                className="bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Visits Log List */}
        {loading ? (
          <div className="text-center py-12 text-xs text-white/40 animate-pulse">
            Chargement des visites en direct...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-12 text-xs text-white/40 italic bg-black/20 rounded-2xl border border-white/5">
            Aucun passage enregistré pour cette sélection. Cliquez sur "Simuler Visite" ci-dessus ou naviguez sur le site pour voir apparaître les données.
          </div>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredVisits.map((visit) => {
              const cityName = visit.city || 'Arcachon';
              const postal = visit.postalCode || '33120';
              const mapsQuery =
                visit.latitude && visit.longitude ? `${visit.latitude},${visit.longitude}` : `${cityName}, France`;

              return (
                <div
                  key={visit.id}
                  className="p-4 bg-black/40 hover:bg-black/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group"
                >
                  {/* Left: Device Icon & Page / Title */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                      {getDeviceIcon(visit.device)}
                    </div>
                    <div>
                      {/* Top line: Page name & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">
                          {visit.pageTitle || visit.page}
                        </span>

                        <code className="text-[11px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                          {visit.page || '/'}
                        </code>

                        {getReferrerBadge(visit.referrer)}

                        {/* Location Link */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] transition-colors"
                          title="Voir sur Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{cityName}</span>
                          {postal && <span className="text-emerald-400/80">({postal})</span>}
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </a>
                      </div>

                      {/* Sub-line: Technical details */}
                      <div className="text-[11px] text-white/50 flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-white/70">{visit.device || 'Mobile'} • {visit.os || 'OS'} • {visit.browser || 'Navigateur'}</span>
                        {visit.screen && <span>({visit.screen})</span>}
                        {visit.isp && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-white/60">
                              <Wifi className="w-3 h-3 text-blue-400" />
                              {visit.isp}
                            </span>
                          </>
                        )}
                        {visit.campaign && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono font-semibold">
                              ?ref={visit.campaign}
                            </span>
                          </>
                        )}
                        {visit.referrerUrl && visit.referrerUrl !== 'Direct' && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] text-white/40" title={visit.referrerUrl}>
                              {visit.referrerUrl}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-amber-300 block">
                        {getRelativeTime(visit.createdAt)}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 block">
                        {getExactDate(visit.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette visite de l'historique"
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
