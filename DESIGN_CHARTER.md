# CHARTE GRAPHIQUE ET CONSTITUTION TECHNIQUE DE RÉFÉRENCE
## ⚠️ DIRECTIVE CRUCIALE POUR L'INTELLIGENCE ARTIFICIELLE / LE DÉVELOPPEUR ⚠️
> **NE MODIFIEZ SOUS AUCUN PRÉTEXTE l'identité visuelle, les couleurs, la typographie, les animations, ou les structures de mise en page définies dans ce document, SAUF sur demande explicite et formulée de l'utilisateur.**
> Si vous effectuez des optimisations de code, des corrections de bugs, ou des ajouts de fonctionnalités, le **résultat visuel final** doit demeurer strictement inchangé par rapport aux spécifications ci-dessous.
> **LISEZ TOUJOURS CE FICHIER AVANT TOUTE INTERVENTION SUR LE CODE.**

---

## 1. THÈME DE COULEURS ET ATMOSPHÈRE SOMBRE
- **Fond du site :** Ultra-sombre `#0a0a0a` (`bg-[#0a0a0a]`).
- **Contrastes de sections :** Saccades douces avec du noir de section `#050505` (`bg-[#050505]`).
- **Halos lumineux fixes d'arrière-plan (Atmosphère Volumétrique) :**
  Un conteneur fixe `fixed inset-0 z-0 opacity-40 pointer-events-none overflow-hidden` contenant deux halos floutés :
  * **En haut à droite :** Un rond de couleur sable/ivoire `#d1d1c4` de 500px flouté à `blur-[120px] rounded-full`.
  * **En bas à gauche :** Un rond de couleur ardoise/sarcelle foncée `#1a2b2c` de 600px flouté à `blur-[150px] rounded-full`.
- **Défilement du contenu :** Tout le contenu de la page doit défiler par-dessus ces lumières immobiles en plaçant le conteneur principal en `relative z-10`. Le wrapper principal de contenu défilant utilise `bg-transparent` pour laisser transparaître ces halos sur les sections comme les Services et les Avis.
- **Sélection de texte :** `selection:bg-[#d1d1c4] selection:text-black`.

---

## 2. COMPOSANTS GLASSMORPHISM ET CONTRASTE AA
- **Cartes de contenu :** Fond blanc translucide `bg-white/5` ou dégradé discret `bg-gradient-to-br from-white/10 to-transparent` avec une fine bordure d'un pixel `border border-white/10` et un effet dépoli `backdrop-blur-md` ou `backdrop-blur-xl`.
- **Séparateurs de sections :** Fines bordures discrètes `border-t border-white/5`.
- **Boutons d'action principaux (High Contrast) :** Fond blanc uni et texte noir gras tout en capitales sans dégradé : `bg-white text-black font-bold uppercase hover:bg-[#d1d1c4] transition-colors`.

---

## 3. TYPOGRAPHIE SIGNATURE
- **Titres phares et expressions décoratives :** Police Serif élégante Georgia, en italique léger : `font-light italic font-serif`.
- **Sur-titres, labels et métadonnées :** Sans-Serif épuré tout en majuscules avec grand espacement de lettres : `text-[10px] tracking-widest uppercase text-[#d1d1c4]`.
- **Texte courant :** Sans-Serif classique blanc tamisé à 60% : `text-white/60 font-light text-sm md:text-base leading-relaxed`.

---

## 4. EFFET PARALLAX ET CHEVAUCHEMENTS (OVERLAPS 3D)
- **Hero Section :** Utilisation de Framer Motion sur un `ref` ciblant la section pour animer le panneau visuel de droite par rapport au défilement vertical :
  ```typescript
  const { scrollYProgress } = useScroll({ target: heroSectionRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  ```
- **Asymétrie des couches (Overlaps) :** Chevauchement d'une petite carte flottante en verre dépoli par-dessus la grande image du Hero avec décalage négatif (`-translate-y-24 md:translate-y-0`) pour créer un effet de glissement de couches de verre lors du scroll.

---

## 5. CARROUSEL 3D COVERFLOW (Carousel3D.tsx)
- **Perspective spatiale :** Conteneur parent avec la classe `[perspective:1000px]`.
- **Positionnement physique d'une carte (offset) :**
  * **Spread horizontal :** `x = offset * 65%`
  * **Zoom (Échelle) :** `scale = 1 - Math.abs(offset) * 0.15`
  * **Rotation vers le centre :** `rotateY = offset * -25`
  * **Physique de transition :** Type ressort lourd et fluide : `transition={{ type: "spring", stiffness: 120, damping: 25, mass: 1.2 }}`.

---

## 6. SLIDER AVANT/APRÈS AUTO-OSCILLANT (BeforeAfterSlider.tsx)
- **Masque de découpe dynamique :** `clipPath: "inset(0 " + (100 - sliderPosition) + "% 0 0)"`.
- **Oscillation automatique autonome :** Quand l'utilisateur n'interagit pas, oscillation douce gérée par `requestAnimationFrame` et un sinus : `50 + Math.sin(time) * 6` (vitesse amortie).
- **Asservissement d'interpolation (Lerp) :** Lors du relâchement manuel du curseur, interpolation linéaire progressive (Lerp factor de `0.03` à `0.06`) pour retourner vers la trajectoire de l'oscillation automatique sans sursaut ni saccade.

---

## 7. RÉSUMÉ DES CONFIGURATIONS CODES-COULEURS DE SAUVEGARDE
```json
{
  "theme": "Artisanat d'Excellence - Sombre Ultra",
  "background": {
    "primary": "#0a0a0a",
    "secondary": "#050505",
    "textSelection": "#d1d1c4"
  },
  "halos": {
    "topRight": {
      "color": "#d1d1c4",
      "size": "500px",
      "blur": "120px",
      "opacity": 0.4
    },
    "bottomLeft": {
      "color": "#1a2b2c",
      "size": "600px",
      "blur": "150px",
      "opacity": 0.4
    }
  },
  "glassmorphism": {
    "background": "rgba(255, 255, 255, 0.05)",
    "border": "rgba(255, 255, 255, 0.10)",
    "blur": "blur(12px)"
  },
  "typography": {
    "serif": "Georgia, serif, italic, font-light",
    "label": "text-[10px], tracking-widest, uppercase, text-[#d1d1c4]",
    "body": "text-white/60, font-light, text-sm/base, leading-relaxed"
  }
}
```
