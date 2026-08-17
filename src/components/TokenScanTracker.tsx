import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSitePageView, trackCaddieScan } from '../utils/visitorTracker';

export default function TokenScanTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track full site circulation & pageview (excluding admin)
    trackSitePageView(location.pathname, location.search);

    // Also track specific caddie token if parameters exist
    const searchParams = new URLSearchParams(location.search);
    trackCaddieScan(searchParams, location.pathname);
  }, [location.pathname, location.search]);

  return null;
}
