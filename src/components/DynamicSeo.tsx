import { useEffect, useState } from 'react';
import { SeoConfig } from '../types';
import { DEFAULT_SEO_CONFIG } from '../data/defaultSeo';

export default function DynamicSeo() {
  const [seo, setSeo] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docSnap = await getDoc(doc(db, 'settings', 'seo'));
        if (!isCancelled && docSnap.exists()) {
          setSeo(docSnap.data() as SeoConfig);
        }
      } catch (err) {
        console.warn("Deferred SEO settings load notice:", err);
      }
    }, 2800);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);


  useEffect(() => {
    if (!seo) return;

    // Update document title
    if (seo.metaTitle) {
      document.title = seo.metaTitle;
    }

    // Helper to update or create meta tags
    const updateMetaTag = (selector: string, value: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${selector}="${value}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(selector, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Description
    if (seo.metaDescription) {
      updateMetaTag('name', 'description', seo.metaDescription);
      updateMetaTag('property', 'og:description', seo.metaDescription);
      updateMetaTag('property', 'twitter:description', seo.metaDescription);
    }

    // Keywords
    if (seo.keywords) {
      updateMetaTag('name', 'keywords', seo.keywords);
    }

    // Open Graph Image
    if (seo.ogImage) {
      updateMetaTag('property', 'og:image', seo.ogImage);
      updateMetaTag('property', 'twitter:image', seo.ogImage);
      updateMetaTag('property', 'twitter:card', 'summary_large_image');
    }

    // Favicon & Web App Touch Icon
    if (seo.faviconUrl) {
      const favEl = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favEl) {
        favEl.href = seo.faviconUrl;
        if (seo.faviconUrl.endsWith('.svg')) {
          favEl.type = 'image/svg+xml';
        } else if (seo.faviconUrl.endsWith('.png')) {
          favEl.type = 'image/png';
        } else if (seo.faviconUrl.endsWith('.ico')) {
          favEl.type = 'image/x-icon';
        } else {
          favEl.removeAttribute('type');
        }
      }
      const appleEl = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleEl) {
        appleEl.href = seo.faviconUrl;
      }
    }

    // JSON-LD Schema (LocalBusiness + AEO + FAQ)
    const scriptId = 'ai-seo-schema';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const schemas = [];

    // LocalBusiness / HomeAndConstructionBusiness Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
      "name": "Parat & Bouey - Artisan Plâtrier Plaquiste Jointeur",
      "legalName": "Parat & Bouey",
      "alternateName": [
        "Parat & Bouey Plâtrerie",
        "Plâtrier Gujan-Mestras Parat & Bouey",
        "Plaquiste Gujan-Mestras Parat & Bouey",
        "Plâtrier Plaquiste Bassin d'Arcachon"
      ],
      "foundingDate": "2010",
      "founder": {
        "@type": "Person",
        "name": "Yohann Bouey",
        "jobTitle": "Gérant & Artisan Plâtrier-Plaquiste",
        "description": "Gérant et artisan plâtrier formé en 2009, en exercice professionnel continu depuis 2010 (plus de 15 ans d'expérience métier sur le Bassin d'Arcachon).",
        "knowsAbout": [
          "Plâtrerie traditionnelle",
          "Pose de placo",
          "Bandes à joint",
          "Plâtrier Gujan-Mestras",
          "SAS anti-poussière sous dépression"
        ]
      },
      "description": seo.aiAgentInstructions || "Artisan Plâtrier et Plaquiste Jointeur sur le Bassin d'Arcachon (Gujan-Mestras, Le Teich, La Teste, Arcachon). Plus de 15 ans d'expérience métier (depuis 2010). Spécialiste de la rénovation intérieure, plâtrerie traditionnelle, pose de placo, joints invisibles et isolation. Garantie Décennale chez Orus.",
      "image": seo.ogImage || "https://www.plaquiste-arcachon.fr/wp-content/uploads/2026/06/IMG_0285-1.jpg",
      "url": "https://www.plaquiste-arcachon.fr",
      "telephone": "+33672159399",
      "priceRange": "€€",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "6 rue Jacques Beynel",
        "addressLocality": "Le Teich",
        "postalCode": "33470",
        "addressRegion": "Gironde",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 44.6322,
        "longitude": -1.0894
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "19:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday"],
          "opens": "08:00",
          "closes": "12:00"
        }
      ],
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": 44.6322,
          "longitude": -1.0894
        },
        "geoRadius": "20000"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "12",
        "bestRating": "5",
        "worstRating": "1"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Prestations de Plâtrerie et Jointoyage",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Pose de cloisons sèches et Placo",
              "description": "Aménagement intérieur, cloisons de séparation, doublage thermique et acoustique."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Jointoiement et finition des bandes",
              "description": "Pose de bandes à joint, ponçage méticuleux et préparation peinture."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Aménagements et bibliothèques sur-mesure en placo",
              "description": "Conception de meubles TV intégrés, niches lumineuses LED, étagères renforcées et agencements sur-mesure."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Plâtrerie traditionnelle et rénovation de plafonds en lattis",
              "description": "Réparation d'enduits, de murs en briquette, reprise de plafonds en lattis et pose de faux-plafonds suspendus."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Protection SAS anti-poussière",
              "description": "Extraction en dépression pour la préservation de la propreté de l'habitat."
            }
          }
        ]
      },
      "knowsAbout": [
        "Plâtrerie",
        "Pose de placo",
        "Joints de placo",
        "Bibliothèques et agencements sur-mesure",
        "Plâtre traditionnel",
        "Plafonnage et réparation de plafonds en lattis",
        "Isolation acoustique du sol",
        "Système de protection SAS anti-poussière",
        "Rénovation intérieure et peinture"
      ]
    });

    // FAQ Schema
    if (seo.faqs && seo.faqs.length > 0) {
      const validFaqs = seo.faqs.filter(f => f.question.trim() && f.answer.trim());
      if (validFaqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": validFaqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        });
      }
    }

    scriptEl.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

  }, [seo]);

  return null; // This component doesn't render anything in the UI
}
