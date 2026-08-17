import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/generate-image-metadata", async (req, res) => {
    try {
      const { imageBase64, userDirectives } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Aucune image fournie." });
      }

      // Generate a high-quality local metadata fallback
      const cities = ["Le Teich", "Gujan-Mestras", "Biganos", "Audenge", "La Teste-de-Buch", "Mios", "Arcachon", "Lanton", "Salles"];
      const targetCity = cities[Math.floor(Math.random() * cities.length)];

      const projects = [
        {
          title: `Rénovation de plâtrerie et faux-plafond à ${targetCity}`,
          description: `Travaux d'aménagement intérieur soignés avec pose de plaques de plâtre BA13 et traitement minutieux des bandes à joint à ${targetCity}. Une finition parfaite par Parat & Bouey.`,
          alt: `Plaques de plâtre BA13 enduites et lissées dans une villa à ${targetCity}`
        },
        {
          title: `Aménagement de combles et isolation thermique à ${targetCity}`,
          description: `Optimisation de l'espace sous rampant et isolation thermique performante à ${targetCity} pour un confort idéal en toute saison. Réalisé par l'artisan Parat & Bouey.`,
          alt: `Pose d'isolant thermo-acoustique et plaques de plâtre sous toiture à ${targetCity}`
        },
        {
          title: `Création de cloisons séparatives et verrière à ${targetCity}`,
          description: `Distribution intelligente des pièces de vie à ${targetCity} avec pose de cloisons en placo et intégration de verrière d'atelier. Un travail d'expert par Parat & Bouey.`,
          alt: `Montage de cloison de distribution en placo avec verrière atelier à ${targetCity}`
        },
        {
          title: `Faux-plafond suspendu avec spots intégrés à ${targetCity}`,
          description: `Rénovation de plafond à ${targetCity} avec éclairage LED encastré et lissage impeccable des bandes d'enduit. Un projet soigné par Parat & Bouey.`,
          alt: `Plafond suspendu en plâtre moderne avec spots d'éclairage à ${targetCity}`
        }
      ];

      const template = projects[Math.floor(Math.random() * projects.length)];

      const metadataFallback = {
        title: template.title,
        description: template.description,
        alt: template.alt
      };

      // Extract real mime type or default to jpeg/webp
      const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");

      // Incorporate optional user directives
      let directivesText = "";
      if (userDirectives && typeof userDirectives === "string" && userDirectives.trim()) {
        directivesText = `\nCONSIGNES PARTICULIÈRES DE L'UTILISATEUR À RESPECTER ABSOLUMENT :
- ${userDirectives.trim()}\n`;
      }

      // 1. Attempt Gemini Vision analysis
      if (apiKey) {
        const prompt = `Tu es un artisan plaquiste-plâtrier et peintre expert sur le Bassin d'Arcachon travaillant pour l'entreprise "Parat & Bouey".
Examine attentivement cette photo réelle de chantier ou de rénovation intérieure et décris PRÉCISÉMENT ce que tu vois sur l'image.

${directivesText}
RÈGLE DE SEO LOCAL ET DE GÉOLOCALISATION IMPÉRATIVE :
Tu dois ABSOLUMENT géolocaliser ce projet en intégrant de façon naturelle la commune suivante dans le titre, la description et la balise ALT : "${targetCity}".
Ne mentionne AUCUNE autre ville que "${targetCity}". Cela permet de diversifier notre référencement local sur les communes que nous couvrons.

ÉTAPES D'ANALYSE VISUELLE DU CHANTIER :
1. Que voit-on concrètement sur la photo ?
   - Les éléments d'ouvrage réalisés : cloisons séparatives BA13, doublage des murs, faux-plafond suspendu, caisson lumineux avec spots intégrés, gorges lumineuses, bandes à joint armées/enduites, lissage/ratissage des surfaces, isolation sous combles/rampants, ossature métallique (rails et montants), verrière d'atelier, niche décorative en placo, habillage de cheminée ou coffrage, etc.
   - L'état d'avancement / finition : ossature métallique visible, pose des plaques de plâtre, passe d'enduit et bandes fraîches, ponçage/ratissage fini prêt à peindre, ou pièce entièrement peinte et aménagée.
   - Les détails visuels : luminosité, spots intégrés, teintes, contrastes, matériaux environnants (parquet, charpente bois, carrelage, grandes baies vitrées).
   - La pièce concernée : salon, séjour cathédrale, combles, suite parentale, salle d'eau, cuisine ouverte, couloir, cage d'escalier, villa arcachonnaise.

2. Rédige un TITRE CONCRET (40 à 65 caractères) :
   - Doit nommer explicitement les travaux et l'espace visibles sur la photo, associé EXCLUSIVEMENT à la ville de "${targetCity}". Exemple : "Rénovation de faux-plafond suspendu à ${targetCity}" ou "Isolation et cloisons de distribution à ${targetCity}".

3. Rédige une DESCRIPTION PRÉCISE ET TECHNIQUE (140 à 250 caractères) :
   - Décris exactement ce qui a été réalisé et ce qui saute aux yeux sur l'image (la planéité des plaques, la qualité des bandes à joint, les découpes précises, l'éclairage intégré, les volumes de la pièce).
   - Intègre obligatoirement la ville de "${targetCity}".
   - Termine en mentionnant le savoir-faire de l'artisan local Parat & Bouey.

4. Rédige un TEXTE ALTERNATIF (ALT) ULTRA-DESCRIPTIF (60 à 130 caractères) :
   - Décrit fidèlement et précisément l'image pour le référencement naturel (SEO) et l'accessibilité, en incluant "${targetCity}".

RÈGLE DE FORMATAGE ABSOLUE POUR ÉVITER LES ERREURS JSON :
- Ne mets JAMAIS de guillemets doubles (") à l'intérieur de tes phrases dans le texte du titre, de la description ou de l'alt (par exemple, n'écris pas "prêt à peindre"). Utilise exclusivement des guillemets simples (') ou des guillemets français (« et ») à la place.
- Réponds STRICTEMENT au format JSON avec cette structure :
{
  "title": "Titre précis et géolocalisé",
  "description": "Description fidèle, technique et géolocalisée de la photo",
  "alt": "Texte alternatif descriptif"
}`;

        let response = null;
        let attempts = 3;
        for (let i = 0; i < attempts; i++) {
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType
                    }
                  },
                  {
                    text: prompt
                  }
                ]
              },
              config: {
                responseMimeType: "application/json",
                temperature: 0.4
              }
            });
            break; // Succeeded, exit loop!
          } catch (geminiError: any) {
            console.warn(`[Gemini API] Attempt ${i + 1} of ${attempts} failed for vision model analysis:`, geminiError?.message || geminiError);
            if (i === attempts - 1) {
              // On final failure, we fall back to our high quality customized metadata
              console.warn(`[Gemini API] All attempts failed, using high-quality local fallback for ${targetCity}`);
              return res.json(metadataFallback);
            }
            // Wait 1200ms before retrying
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        }

        const text = response?.text;
        if (text) {
          try {
            const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleanText);
            if (parsed && (parsed.title || parsed.description)) {
              return res.json({
                title: parsed.title || metadataFallback.title,
                description: parsed.description || metadataFallback.description,
                alt: parsed.alt || metadataFallback.alt
              });
            }
          } catch (parseError) {
            console.warn("[Gemini API] Parsing error on response text, using fallback", parseError);
          }
        }
      }

      // No API key or other issue, return beautiful fallback
      return res.json(metadataFallback);
    } catch (error: any) {
      console.warn("Image metadata endpoint handler warning:", error?.message || error);
      res.status(500).json({ 
        error: "Erreur interne lors du traitement de l'image." 
      });
    }
  });

  app.post("/api/generate-blog-post", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({ error: "Sujet de l'article manquant." });
      }

      const prompt = `Tu es un rédacteur web SEO et expert technique en plâtrerie, isolation et aménagement intérieur pour l'entreprise artisanale "Parat & Bouey", basée sur le Bassin d'Arcachon (Arcachon, Le Teich, Gujan-Mestras, Biganos, La Teste-de-Buch, Mios, Salles).

Rédige un article de blog SEO complet, captivant et très professionnel sur le sujet suivant : "${topic}".

Règles de rédaction et SEO local :
1. Titre : Accrocheur, intégrant le besoin du client et le domaine ou la région (ex: Bassin d'Arcachon, Arcachon, etc.). Max 70 caractères.
2. Catégorie : Choisis EXACTEMENT l'une des 4 catégories suivantes :
   - "Rénovation & Conseils"
   - "Isolation & Acoustique"
   - "Geste Artisanal"
   - "Réglementation & DTU"
3. Résumé court (excerpt) : 2 à 3 sentences percutantes résumant l'article (max 220 caractères).
4. Contenu complet (contentText) : Rédige un article complet de 4 à 6 paragraphes riches, pros et pédagogiques. Utilise '### Titre de section' pour structurer les sous-titres. Donne des vrais conseils techniques (ex: type de plaque BA13, bande à joint, temps de séchage, résistance à l'humidité/hydrofuge pour pièces humides, etc.).
5. Temps de lecture : ex "4 min de lecture".
6. Auteur : "Conseils Plâtrerie • Bassin d'Arcachon"

Réponds UNIQUEMENT au format JSON avec cette structure exacte :
{
  "title": "Titre de l'article",
  "category": "Une des 4 catégories exactes",
  "excerpt": "Résumé court",
  "contentText": "Texte complet avec paragraphes séparés par des sauts de ligne et sous-titres ###",
  "readingTime": "5 min de lecture",
  "author": "Conseils Plâtrerie • Bassin d'Arcachon"
}`;

      if (apiKey) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7
            }
          });

          const text = response?.text;
          if (text) {
            const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const result = JSON.parse(cleanText);
            if (result && (result.title || result.contentText)) {
              return res.json(result);
            }
          }
        } catch (error: any) {
          const isRateLimit = error?.status === 429 || error?.message?.includes("429");
          console.warn(`[Gemini API] Blog post generation fallback engaged: ${isRateLimit ? '429 Rate Limit' : (error?.message || error)}`);
        }
      }

      // High quality structured blog fallback if API unavailable
      const sanitizedTopic = topic.trim();
      const articleFallback = {
        title: `${sanitizedTopic} : Conseils et Savoir-Faire sur le Bassin d'Arcachon`,
        category: sanitizedTopic.toLowerCase().includes("isol") ? "Isolation & Acoustique" :
                  sanitizedTopic.toLowerCase().includes("dtu") || sanitizedTopic.toLowerCase().includes("norme") ? "Réglementation & DTU" :
                  sanitizedTopic.toLowerCase().includes("geste") || sanitizedTopic.toLowerCase().includes("joint") ? "Geste Artisanal" : "Rénovation & Conseils",
        excerpt: `Découvrez les recommandations techniques de Parat & Bouey pour réussir vos travaux de ${sanitizedTopic.toLowerCase()} avec des finitions impeccables sur le Bassin d'Arcachon.`,
        contentText: `### Comprendre les enjeux : ${sanitizedTopic}\n\nDans tout projet de rénovation ou de construction neuve sur le Bassin d'Arcachon, la qualité de mise en œuvre de la plâtrerie et de l'isolation est déterminante pour le confort thermique, phonique et esthétique de votre logement. Qu'il s'agisse d'une villa à Arcachon ou d'une maison contemporaine à Gujan-Mestras ou Le Teich, chaque chantier requiert une attention particulière aux détails.\n\n### Les étapes clés et le respect des normes DTU 25.41\n\nLa pose commence par l'implantation précise des ossatures métalliques et le traitement des ponts thermiques. Le choix des plaques (BA13 standard, hydrofuge pour les pièces d'eau, ou haute dureté) doit correspondre précisément à l'usage de la pièce. Le collage et le serrage des bandes à joint garantissent une résistance mécanique durable sans risque de microfissures dans le temps.\n\n### Finitions et préparation des supports\n\nPour obtenir un rendu soigné prêt à peindre, un travail de ratissage ou d'enduisage fin est indispensable. Ce lissage méticuleux efface tout raccord et permet à la lumière naturelle de se diffuser harmonieusement sur vos murs et faux-plafonds.\n\n### L'accompagnement par un artisan local de confiance\n\nFaire appel à l'entreprise Parat & Bouey, c'est bénéficier d'un savoir-faire reconnu, de conseils avisés et d'un chantier propre et respectueux des délais partout sur le Bassin d'Arcachon. N'hésitez pas à nous contacter pour une étude personnalisée de votre projet.`,
        readingTime: "4 min de lecture",
        author: "Conseils Plâtrerie • Bassin d'Arcachon"
      };

      return res.json(articleFallback);
    } catch (error: any) {
      console.warn("Blog generation fatal error:", error?.message || error);
      res.status(500).json({ error: "Erreur lors de la génération de l'article." });
    }
  });

  app.post("/api/shorten-url", async (req, res) => {
    try {
      const { url, service = "tinyurl", alias } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL destination manquante." });
      }

      const cleanAlias = alias ? alias.trim().replace(/[^a-zA-Z0-9_-]/g, "") : "";

      // 1. Try TinyURL first (with custom alias if provided, or auto)
      try {
        let tinyApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
        if (cleanAlias) {
          tinyApi += `&alias=${encodeURIComponent(cleanAlias)}`;
        }
        const tinyRes = await fetch(tinyApi, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (tinyRes.ok) {
          const text = (await tinyRes.text()).trim();
          if (text.startsWith("http://") || text.startsWith("https://")) {
            return res.json({ shortUrl: text, service: "tinyurl" });
          }
        }

        // TinyURL fallback without alias if alias was taken
        if (cleanAlias) {
          const tinyFallback = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          if (tinyFallback.ok) {
            const text = (await tinyFallback.text()).trim();
            if (text.startsWith("http://") || text.startsWith("https://")) {
              return res.json({ 
                shortUrl: text, 
                service: "tinyurl",
                warning: `L'alias "${cleanAlias}" était déjà utilisé, un lien TinyURL unique a été généré avec succès !`
              });
            }
          }
        }
      } catch (e) {
        console.warn("TinyURL request failed:", e);
      }

      // 2. Try is.gd with safe text parsing
      try {
        let isgdApi = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
        if (cleanAlias) {
          isgdApi += `&shorturl=${encodeURIComponent(cleanAlias)}`;
        }
        const isgdRes = await fetch(isgdApi, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = (await isgdRes.text()).trim();
        if (isgdRes.ok && (text.startsWith("http://") || text.startsWith("https://"))) {
          return res.json({ shortUrl: text, service: "isgd" });
        }

        // Fallback is.gd without alias
        if (cleanAlias) {
          const isgdFallback = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          const fbText = (await isgdFallback.text()).trim();
          if (isgdFallback.ok && (fbText.startsWith("http://") || fbText.startsWith("https://"))) {
            return res.json({ 
              shortUrl: fbText, 
              service: "isgd",
              warning: `L'alias "${cleanAlias}" était déjà utilisé, un lien is.gd unique a été généré avec succès !`
            });
          }
        }
      } catch (e) {
        console.warn("is.gd request failed:", e);
      }

      // 3. Try clck.ru as high-reliability fallback
      try {
        const clckRes = await fetch(`https://clck.ru/--?url=${encodeURIComponent(url)}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (clckRes.ok) {
          const text = (await clckRes.text()).trim();
          if (text.startsWith("http://") || text.startsWith("https://")) {
            return res.json({ shortUrl: text, service: "clck" });
          }
        }
      } catch (e) {
        console.warn("clck.ru request failed:", e);
      }

      // 4. Try da.gd as additional fallback
      try {
        const dagdRes = await fetch(`https://da.gd/s?url=${encodeURIComponent(url)}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (dagdRes.ok) {
          const text = (await dagdRes.text()).trim();
          if (text.startsWith("http://") || text.startsWith("https://")) {
            return res.json({ shortUrl: text, service: "dagd" });
          }
        }
      } catch (e) {
        console.warn("da.gd request failed:", e);
      }

      // Fallback: return direct url cleanly
      return res.json({ 
        shortUrl: url, 
        service: "direct",
        warning: "Les réducteurs d'URL externes sont temporairement inaccessibles, le lien direct a été conservé."
      });
    } catch (err: any) {
      console.error("Shorten URL general error:", err);
      res.status(500).json({ error: err.message || "Erreur lors du raccourcissement de l'URL." });
    }
  });

  // Fast Geolocation API endpoint by IP
  app.get("/api/geolocate-ip", async (req, res) => {
    try {
      const rawIp = (req.headers["cf-connecting-ip"] as string) ||
                    (req.headers["x-real-ip"] as string) ||
                    ((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()) ||
                    req.socket.remoteAddress || "";

      const cleanIp = rawIp.replace(/^::ffff:/, "").trim();
      const isLocal = !cleanIp || cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.");

      // 1. Try ipwho.is with French language support
      try {
        const url = isLocal ? "https://ipwho.is/?lang=fr" : `https://ipwho.is/${cleanIp}?lang=fr`;
        const ipRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (ipRes.ok) {
          const data: any = await ipRes.json();
          if (data && data.success !== false) {
            return res.json({
              city: data.city || "Arcachon",
              region: data.region || "Nouvelle-Aquitaine",
              department: data.region || "Gironde (33)",
              postalCode: data.postal || "33120",
              country: data.country || "France",
              countryCode: data.country_code || "FR",
              latitude: data.latitude || 44.6586,
              longitude: data.longitude || -1.1648,
              isp: data.connection?.isp || data.connection?.org || "Opérateur Internet"
            });
          }
        }
      } catch (e) {
        console.warn("ipwho.is failed:", e);
      }

      // 2. Fallback ipapi.co
      try {
        const url = isLocal ? "https://ipapi.co/json/" : `https://ipapi.co/${cleanIp}/json/`;
        const ipRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (ipRes.ok) {
          const data: any = await ipRes.json();
          if (data && !data.error) {
            return res.json({
              city: data.city || "Arcachon",
              region: data.region || "Nouvelle-Aquitaine",
              department: data.region || "Gironde",
              postalCode: data.postal || "33120",
              country: data.country_name || "France",
              countryCode: data.country_code || "FR",
              latitude: data.latitude || 44.6586,
              longitude: data.longitude || -1.1648,
              isp: data.org || "Opérateur"
            });
          }
        }
      } catch (e) {
        console.warn("ipapi.co failed:", e);
      }

      // Default Arcachon / Gironde fallback
      return res.json({
        city: "Arcachon",
        region: "Nouvelle-Aquitaine",
        department: "Gironde (33)",
        postalCode: "33120",
        country: "France",
        countryCode: "FR",
        latitude: 44.6586,
        longitude: -1.1648,
        isp: "Orange / SFR / Bouygues"
      });
    } catch (err: any) {
      console.error("Geolocate error:", err);
      res.json({
        city: "Arcachon",
        region: "Nouvelle-Aquitaine",
        department: "Gironde (33)",
        postalCode: "33120",
        country: "France",
        countryCode: "FR",
        latitude: 44.6586,
        longitude: -1.1648
      });
    }
  });

  // 301 SEO Redirects from old WordPress site
  app.get('/zones-intervention-renovation-bassin-arcachon*', (req, res) => {
    res.redirect(301, '/#zone-intervention');
  });

  app.get('/plaquiste-platrier-bassin-arcachon/mentions-legales*', (req, res) => {
    res.redirect(301, '/mentions-legales');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
