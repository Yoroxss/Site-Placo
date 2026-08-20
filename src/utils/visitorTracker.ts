import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface DeviceInfo {
  device: 'Mobile' | 'Tablet' | 'Desktop';
  os: string;
  browser: string;
  screen: string;
}

export interface GeoLocationInfo {
  city: string;
  region: string;
  department: string;
  postalCode: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

export interface ReferrerCategory {
  category: 'Google SEO' | 'Direct / QR' | 'Instagram' | 'Facebook' | 'Jeton Caddie' | 'PagesJaunes' | 'LeBonCoin' | 'Autre Référent';
  domain: string;
  raw: string;
}

export function detectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { device: 'Desktop', os: 'Inconnu', browser: 'Inconnu', screen: '0x0' };
  }

  const ua = navigator.userAgent || '';
  const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;

  // Device Detection
  let device: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    device = 'Mobile';
  }

  // OS Detection
  let os = 'Inconnu';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Inconnu';
  if (/CriOS|Chrome/i.test(ua) && !/Edge|Edg|OPR|Opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  }

  return { device, os, browser, screen };
}

// In-memory cache for geolocation during current browser lifecycle
let cachedGeoLocation: GeoLocationInfo | null = null;

/**
 * Fetch estimated city/region from IP transparently without asking GPS prompts.
 * Cached in memory & sessionStorage so it's super fast (<50ms after first check).
 */
export async function fetchVisitorLocation(): Promise<GeoLocationInfo> {
  if (cachedGeoLocation) return cachedGeoLocation;

  const defaultGeo: GeoLocationInfo = {
    city: 'Arcachon',
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde (33)',
    postalCode: '33120',
    country: 'France',
    countryCode: 'FR',
    latitude: 44.6586,
    longitude: -1.1648,
    isp: 'Opérateur Local'
  };

  try {
    const saved = sessionStorage.getItem('pb_visitor_geo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.city) {
        cachedGeoLocation = parsed;
        return parsed;
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // 1. Try server internal geo proxy
    const res = await fetch('/api/geolocate-ip', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.city) {
          const geo: GeoLocationInfo = {
            city: data.city || 'Arcachon',
            region: data.region || 'Nouvelle-Aquitaine',
            department: data.department || (data.postalCode?.startsWith('33') ? 'Gironde (33)' : data.region || 'Gironde'),
            postalCode: data.postalCode || '33120',
            country: data.country || 'France',
            countryCode: data.countryCode || 'FR',
            latitude: data.latitude || 44.6586,
            longitude: data.longitude || -1.1648,
            isp: data.isp || ''
          };
          cachedGeoLocation = geo;
          try {
            sessionStorage.setItem('pb_visitor_geo', JSON.stringify(geo));
          } catch {}
          return geo;
        }
      }
    }
  } catch {
    // Attempt fast client fallback via ipwho.is
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://ipwho.is/?lang=fr', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.city) {
          const geo: GeoLocationInfo = {
            city: data.city || 'Arcachon',
            region: data.region || 'Nouvelle-Aquitaine',
            department: data.region || 'Gironde (33)',
            postalCode: data.postal || '33120',
            country: data.country || 'France',
            countryCode: data.country_code || 'FR',
            latitude: data.latitude || 44.6586,
            longitude: data.longitude || -1.1648,
            isp: data.connection?.isp || ''
          };
          cachedGeoLocation = geo;
          try {
            sessionStorage.setItem('pb_visitor_geo', JSON.stringify(geo));
          } catch {}
          return geo;
        }
      }
    } catch {}
  }

  return defaultGeo;
}

/**
 * Categorize acquisition source / referrer
 */
export function categorizeReferrer(rawReferrer: string, searchParams?: URLSearchParams): ReferrerCategory {
  const ref = rawReferrer.toLowerCase();
  const campaign = searchParams?.get('ref') || searchParams?.get('r') || searchParams?.get('utm_source') || searchParams?.get('s') || searchParams?.get('jeton');

  if (campaign) {
    return {
      category: 'Jeton Caddie',
      domain: `Campagne ?ref=${campaign}`,
      raw: rawReferrer || `?ref=${campaign}`
    };
  }

  if (!ref || ref === '' || ref === 'direct') {
    return {
      category: 'Direct / QR',
      domain: 'Accès Direct / QR Code',
      raw: 'Direct'
    };
  }

  if (ref.includes('google.')) {
    return {
      category: 'Google SEO',
      domain: 'google.fr',
      raw: rawReferrer
    };
  }

  if (ref.includes('instagram.')) {
    return {
      category: 'Instagram',
      domain: 'instagram.com',
      raw: rawReferrer
    };
  }

  if (ref.includes('facebook.') || ref.includes('fb.com')) {
    return {
      category: 'Facebook',
      domain: 'facebook.com',
      raw: rawReferrer
    };
  }

  if (ref.includes('pagesjaunes.')) {
    return {
      category: 'PagesJaunes',
      domain: 'pagesjaunes.fr',
      raw: rawReferrer
    };
  }

  if (ref.includes('leboncoin.')) {
    return {
      category: 'LeBonCoin',
      domain: 'leboncoin.fr',
      raw: rawReferrer
    };
  }

  try {
    const url = new URL(rawReferrer);
    return {
      category: 'Autre Référent',
      domain: url.hostname.replace(/^www\./, ''),
      raw: rawReferrer
    };
  } catch {
    return {
      category: 'Autre Référent',
      domain: rawReferrer.slice(0, 50),
      raw: rawReferrer
    };
  }
}

/**
 * Get or create unique session ID and new visitor flag
 */
export function getVisitorSession(): { sessionId: string; isNewVisitor: boolean } {
  let sessionId = '';
  let isNewVisitor = false;

  try {
    sessionId = sessionStorage.getItem('pb_session_id') || '';
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('pb_session_id', sessionId);
    }

    const returningKey = 'pb_has_visited_before';
    if (!localStorage.getItem(returningKey)) {
      isNewVisitor = true;
      localStorage.setItem(returningKey, 'true');
    }
  } catch {
    sessionId = `s_${Date.now()}`;
  }

  return { sessionId, isNewVisitor };
}

// Keep track of current visit doc ID to update time spent
let currentVisitDocId: string | null = null;
let visitStartTime: number = Date.now();

/**
 * Main General Traffic Tracker: tracks all site circulation (Home, City pages, Blog, etc.)
 */
export async function trackSitePageView(pathname: string, search: string): Promise<string | null> {
  // Never track admin panel itself
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const now = Date.now();
  const searchParams = new URLSearchParams(search);

  // Debounce same page rapid reloading within 5s
  const lastTrackedKey = `pb_last_pv_${pathname}`;
  const lastTime = sessionStorage.getItem(lastTrackedKey);
  if (lastTime && now - Number(lastTime) < 5000) {
    return null;
  }
  sessionStorage.setItem(lastTrackedKey, String(now));

  // Determine page title
  let pageTitle = document.title || 'Parat & Bouey - Plâtrerie & Rénovation';
  if (pathname.startsWith('/artisan-plaquiste/')) {
    const city = pathname.replace('/artisan-plaquiste/', '').replace(/-/g, ' ');
    pageTitle = `Artisan Plaquiste ${city.charAt(0).toUpperCase() + city.slice(1)}`;
  } else if (pathname === '/blog') {
    pageTitle = 'Blog & Conseils Techniques';
  } else if (pathname.startsWith('/blog/')) {
    pageTitle = `Article Blog: ${pathname.replace('/blog/', '')}`;
  } else if (pathname === '/mentions-legales') {
    pageTitle = 'Mentions Légales';
  } else if (pathname === '/') {
    pageTitle = 'Accueil - Plâtrerie Bassin d\'Arcachon';
  }

  const { sessionId, isNewVisitor } = getVisitorSession();
  const devInfo = detectDeviceInfo();
  const geoInfo = await fetchVisitorLocation();
  const rawReferrer = typeof document !== 'undefined' ? (document.referrer || 'Direct') : 'Direct';
  const refInfo = categorizeReferrer(rawReferrer, searchParams);
  const campaign = searchParams.get('ref') || searchParams.get('r') || searchParams.get('utm_source') || searchParams.get('s') || searchParams.get('jeton') || '';

  try {
    visitStartTime = Date.now();
    const docRef = await addDoc(collection(db, 'site_visits'), {
      sessionId: sessionId,
      page: pathname,
      pageTitle: pageTitle.slice(0, 200),
      referrer: refInfo.category,
      referrerUrl: refInfo.raw.slice(0, 500),
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
      isp: geoInfo.isp || null,
      campaign: campaign.slice(0, 100),
      action: 'pageview',
      durationSec: 0,
      isNewVisitor: isNewVisitor,
      createdAt: serverTimestamp()
    });

    currentVisitDocId = docRef.id;

    // Also track as specific caddie scan if campaign tag present
    if (campaign) {
      trackCaddieScan(searchParams, pathname);
    }

    return docRef.id;
  } catch (error) {
    console.error('Erreur enregistrement visite:', error);
    return null;
  }
}

/**
 * Track user interactions (Call click, Quote click, Gallery click, etc.)
 */
export async function trackUserAction(actionName: string, details?: string): Promise<void> {
  try {
    const { sessionId } = getVisitorSession();
    const devInfo = detectDeviceInfo();
    const geoInfo = await fetchVisitorLocation();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    if (currentPath.startsWith('/admin')) return;

    await addDoc(collection(db, 'site_visits'), {
      sessionId: sessionId,
      page: currentPath,
      pageTitle: `Action: ${actionName}`,
      referrer: 'Interaction Utilisateur',
      referrerUrl: details || '',
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
      action: actionName,
      durationSec: Math.round((Date.now() - visitStartTime) / 1000),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Erreur track action:', err);
  }
}

/**
 * Checks for tracking parameters (?ref=..., ?source=..., ?utm_source=...)
 * and logs the scan to Firestore with real city / geolocation.
 */
export async function trackCaddieScan(searchParams: URLSearchParams, pathname: string): Promise<boolean> {
  const ref = searchParams.get('ref') || searchParams.get('r');
  const source = searchParams.get('source') || searchParams.get('s');
  const utmSource = searchParams.get('utm_source');
  const jeton = searchParams.get('jeton') || searchParams.get('j');
  const caddie = searchParams.get('caddie');

  const rawSource = ref || source || utmSource || (jeton !== null ? (jeton || 'jeton') : null) || (caddie !== null ? (caddie || 'caddie') : null);

  if (!rawSource) {
    return false;
  }

  const sourceTag = rawSource.trim().toLowerCase().slice(0, 100);

  // Guard against duplicate logs within 10 minutes in the same session
  const sessionKey = `pb_caddie_tracked_${sourceTag}`;
  const lastLogged = sessionStorage.getItem(sessionKey);
  const now = Date.now();

  if (lastLogged && now - Number(lastLogged) < 10 * 60 * 1000) {
    // Already tracked in this session recently
    return false;
  }

  try {
    const devInfo = detectDeviceInfo();
    const geoInfo = await fetchVisitorLocation();
    const referrer = document.referrer ? document.referrer.slice(0, 500) : 'Direct / Scan QR Jeton';
    const rawUrl = typeof window !== 'undefined' ? window.location.href.slice(0, 500) : '';

    await addDoc(collection(db, 'caddie_scans'), {
      source: sourceTag,
      rawUrl: rawUrl,
      path: pathname || '/',
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
      isp: geoInfo.isp || null,
      referrer: referrer,
      createdAt: serverTimestamp()
    });

    sessionStorage.setItem(sessionKey, String(now));
    try {
      localStorage.setItem('pb_last_token_source', sourceTag);
    } catch {}

    return true;
  } catch (error) {
    console.error('Erreur lors du suivi du jeton caddie:', error);
    return false;
  }
}
