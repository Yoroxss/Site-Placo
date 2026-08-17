/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense, useEffect } from 'react';
import Home from './pages/Home';
import CookieBanner from './components/CookieBanner';
import DynamicSeo from './components/DynamicSeo';
import TokenScanTracker from './components/TokenScanTracker';
import { AdminProvider } from './contexts/AdminContext';

const Admin = lazy(() => import('./pages/Admin'));
const LegalMentions = lazy(() => import('./pages/LegalMentions'));
const CityPage = lazy(() => import('./pages/CityPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <AdminProvider>
        <Router>
          <ScrollToHash />
          <TokenScanTracker />
          <DynamicSeo />
          <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#d1d1c4] selection:text-black relative overflow-hidden flex flex-col">
            {/* Background Atmosphere: Rich Luminous Ambient Halos (Radial Gradients for 100% Safari & Mobile 4G Performance) */}
            <div 
              className="fixed inset-0 z-0 pointer-events-none overflow-hidden" 
              style={{
                backgroundImage: `
                  radial-gradient(circle at 90% 5%, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 70%),
                  radial-gradient(circle at 5% 40%, rgba(26, 43, 44, 0.55) 0%, rgba(26, 43, 44, 0.15) 45%, transparent 70%),
                  radial-gradient(circle at 85% 90%, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.02) 40%, transparent 65%)
                `
              }} 
            />
            
            <div className="relative z-10 flex flex-col flex-1">
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/mentions-legales" element={<LegalMentions />} />
                  <Route path="/artisan-plaquiste/:city" element={<CityPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />

                  {/* Redirections 301 SEO Héritage Ancien Site WordPress */}
                  <Route path="/zones-intervention-renovation-bassin-arcachon" element={<Navigate to="/#zone-intervention" replace />} />
                  <Route path="/plaquiste-platrier-bassin-arcachon/mentions-legales" element={<Navigate to="/mentions-legales" replace />} />
                </Routes>
              </Suspense>
              <CookieBanner />
            </div>
          </div>
        </Router>
      </AdminProvider>
    </HelmetProvider>
  );
}
