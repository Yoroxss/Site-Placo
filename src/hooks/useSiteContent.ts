import { useState, useEffect } from 'react';
import type { SiteContent } from '../types';

const defaultContent: SiteContent = {
  heroTitle: "L'artisanat dédié exclusivement à votre intérieur.",
  heroSubtitle: "Spécialiste de la rénovation de qualité en milieu habité, petits chantiers et particuliers au Teich, Biganos et sur le Bassin d’Arcachon.",
  aboutText1: "Je ne travaille pas que sur les gros chantiers de construction massive ou les grands ensembles. J’aime aussi, et je privilégie le contact avec les clients et j’aime repartir avec la satisfaction et le sourire. Mon métier est d’intervenir chez vous, dans votre quotidien. Cette spécialisation me permet de maîtriser ce que les grandes entreprises négligent : Votre foyer et vos biens.",
  aboutText2: "Je mets un point d’honneur à garantir le confort et la santé de tous sur mes chantiers (ouvriers, clients et moi-même). Cela passe par l’utilisation rigoureuse d’EPI, de protections adaptées et d’un système d’extraction d’air pour limiter les particules volatiles."
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(() => {
    try {
      const cached = localStorage.getItem('pb_content_cache');
      return cached ? JSON.parse(cached) : defaultContent;
    } catch { return defaultContent; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docSnap = await getDoc(doc(db, 'content', 'main'));
        if (!isCancelled && docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          setContent(data);
          try { localStorage.setItem('pb_content_cache', JSON.stringify(data)); } catch {}
        }
      } catch (error) {
        console.warn("Content load notice:", error);
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const updateContent = async (newContent: SiteContent, adminCode: string) => {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await setDoc(doc(db, 'content', 'main'), {
        heroTitle: newContent.heroTitle,
        heroSubtitle: newContent.heroSubtitle,
        aboutText1: newContent.aboutText1,
        aboutText2: newContent.aboutText2,
        adminCode,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating content:", error);
      return false;
    }
  };

  return { content, loading, updateContent };
}

