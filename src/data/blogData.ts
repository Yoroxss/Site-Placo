import { DEFAULT_GALLERY_IMAGES } from './defaultImages';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readingTime: string;
  date: string;
  imageUrl: string;
  author: string;
  content: string[];
}

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-degat-des-eaux',
    slug: 'que-faire-apres-degat-des-eaux-plafond-platre-bassin-arcachon',
    title: 'Que faire après un dégât des eaux sur un plafond en plâtre ou placo ?',
    category: 'Rénovation & Conseils',
    excerpt: 'Séchage indispensable, contrôle d’humidité, découpe des zones fragilisées et rénovation des joints à la bande papier : les règles d’or.',
    readingTime: '4 min de lecture',
    date: 'Août 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: DEFAULT_GALLERY_IMAGES[0]?.url || '',
    content: [
      "Infiltration par le toit, fuite en étage ou coup de vent sur le Bassin d'Arcachon : un dégât des eaux sur un plafond en placo ou en plâtre traditionnel demande d'observer quelques règles simples avant de songer à la finition peinture.",
      "### Conseil 1 : Laissez sécher la zone avant toute intervention",
      "Ne tentez pas de reboucher ou d'enduire une surface gorgée d'eau. La plaque de plâtre mouillée perd sa rigidité et risque d'emprisonner l'humidité, provoquant moisissures et auréoles persistantes. Il est recommandé de laisser sécher la pièce pendant 2 à 3 semaines avec une bonne ventilation.",
      "### Conseil 2 : Évaluer si une purge est nécessaire",
      "Si la plaque ou l'enduit plâtre a gondolé ou s'est ramolli, la partie abîmée doit être découpée proprement jusqu'aux éléments sains. Selon le type d'ossature (bois ou métallique), des renforts permettent de fixer la nouvelle plaque de remplacement.",
      "### Conseil 3 : Traiter les auréoles et réaliser un raccord à la bande papier",
      "Pour éviter que les traces de bistre ou d'humidité ne réapparaissent sous la peinture neuve, l'application d'une impression isolante spéciale anti-taches est conseillée. Le raccordement se fait obligatoirement avec de la bande papier micro-perforée (seule norme conforme DTU pour la tenue mécanique) et un enduit de lissage soigneusement poncé sous éclairage rasant."
    ]
  },
  {
    id: 'post-isolation-maison-bois',
    slug: 'isolation-phonique-thermique-maison-bois-echoppe-bassin-arcachon',
    title: 'Comment isoler du froid et du bruit une maison en bois ou une échoppe sur le Bassin ?',
    category: 'Isolation & Acoustique',
    excerpt: 'Laine minérale, pose d’isolant, confort acoustique et gestion technique des passages de portes en rénovation de plancher.',
    readingTime: '6 min de lecture',
    date: 'Août 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: DEFAULT_GALLERY_IMAGES[1]?.url || DEFAULT_GALLERY_IMAGES[0]?.url || '',
    content: [
      "Les maisons en ossature bois (très répandues au Teich, Gujan-Mestras, La Teste ou Arcachon) ainsi que les échoppes anciennes ont un charme indéniable, mais nécessitent une réflexion globale sur l'isolation thermique (laine de verre ou laine de roche) et la réduction des bruits d'impact.",
      "### Idée reçue : Le pare-vapeur est-il systématique en rénovation ?",
      "Non, l'ajout d'une membrane pare-vapeur n'est pas automatique en rénovation. Tout dépend de la composition existante des murs, du type d'isolant choisi, de l'étanchéité à l'air et de la ventilation (VMC) en place. Une étude préalable permet de déterminer si la paroi a besoin de respirer ou si un frein-vapeur hygrovariable est pertinent.",
      "### Bruits de pas et plancher bois : Attention à la hauteur sous porte !",
      "Sur les planchers bois à l'étage qui résonnent ou présentent de faux niveaux, des solutions d'égalisation de sol (type billes légères + plaques de sol) permettent de rattraper jusqu'à 10 cm et d'isoler phoniquement.",
      "Attention toutefois à la contrainte technique majeure : cette surépaisseur monte le niveau fini du sol. En rénovation lourde, cela nécessite d'adapter les ouvertures (délignage du bas des portes ou remplacement des bloc-portes) et de gérer le niveau de départ de l'escalier.",
      "Pour les rénovations où la hauteur sous plafond ne permet pas de surélever le sol, l'isolation acoustique s'effectue idéalement par le dessous, via un faux-plafond désolidarisé intégrant de la laine de verre de haute densité."
    ]
  },
  {
    id: 'post-platrier-vs-peintre',
    slug: 'pourquoi-choisir-platrier-jointeur-plutot-que-peintre-pour-les-bandes',
    title: 'Pourquoi confier la réalisation des bandes à un artisan plâtrier-jointeur ?',
    category: 'Geste Artisanal',
    excerpt: 'Bandes papier, boîte à joints, ratissage et ponçage rasant : pourquoi la préparation de surface exige la maîtrise du spécialiste.',
    readingTime: '5 min de lecture',
    date: 'Juillet 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: DEFAULT_GALLERY_IMAGES[2]?.url || DEFAULT_GALLERY_IMAGES[0]?.url || '',
    content: [
      "La qualité finale d'un plafond ou d'une cloison peinte dépend à 90 % de la préparation du support. C'est là qu'intervient le savoir-faire spécifique du jointeur.",
      "### Bandes papier vs Calicot grillagé : Attention aux règles DTU",
      "Il existe une différence majeure entre les types de bandes. Les bandes en filet/calicot auto-adhésif sont fortement déconseillées et même proscrites au plafond par les normes DTU 25.41, car elles créent des micro-fissures avec le travail de la charpente. Le plâtrier-jointeur utilise exclusivement des bandes papier spécialisées (et bandes papier armées pour les angles sortants), collées et serrées dans l'enduit.",
      "### Outillage spécialisé : Boîte à joints et lumière rasante",
      "L'utilisation d'outils professionnels (boîtes à joints mécaniques, platoirs de finition, couteaux à enduire à lame inox souple) garantit une épaisseur constante d'enduit. L'inspection systématique à la lampe rasière permet de corriger la moindre surépaisseur avant la sous-couche de peinture.",
      "### Protection du chantier et confort de l'habitat",
      "Lors des rénovations en milieu occupé, la gestion de la poussière fine de plâtre est un point crucial. L'utilisation de ponceuses aspirantes et de bâchages étanches permet de maintenir un espace sain durant la phase de finition."
    ]
  },
  {
    id: 'post-choisir-plaque-cloisons',
    slug: 'choisir-plaque-de-platre-cloisons-bassin-arcachon-placo-hydro-phonique',
    title: 'Comment bien choisir ses plaques de plâtre et cloisons pour sa maison sur le Bassin ?',
    category: 'Pose de Placo & Cloisons',
    excerpt: 'Placo hydrofuge, plaque phonique, haute résistance ou BA13 standard : le guide technique pour réussir l\'aménagement de vos pièces.',
    readingTime: '5 min de lecture',
    date: 'Août 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: DEFAULT_GALLERY_IMAGES[3]?.url || DEFAULT_GALLERY_IMAGES[0]?.url || '',
    content: [
      "Que ce soit pour créer une suite parentale, redistribuer une échoppe ou aménager des combles, la pose de cloisons en plaques de plâtre (BA13) nécessite de sélectionner la bonne typologie de plaque selon les contraintes de chaque pièce.",
      "### Pièces humides : L'impératif de la plaque hydrofuge (Vert/Bleu)",
      "Dans les salles de bains, cuisines et buanderies du Bassin d'Arcachon, l'humidité ambiante exige des plaques hydrofuges de type H1 (Siniat Hydro, Placo Placomarine). Elles résistent jusqu'à 6 fois mieux à l'eau qu'une plaque standard et préviennent tout décollement du carrelage ou faïence.",
      "### Cloisons de séparation : Pourquoi doubler ou utiliser du Placo Phonique ?",
      "Pour les chambres et bureaux, la plaque phonique haute densité réduit les transmissions sonores jusqu'à -50%. Le doublage croisé de plaques sur ossature métallique désolidarisée apporte un confort acoustique optimal.",
      "### Charges lourdes et meubles suspendus : Les plaques haute dureté",
      "Pour fixer des meubles de cuisine, télévisions suspendues ou vasques sans renforts bois préalables, des plaques à très haute densité (type Habito ou Solidroc) permettent de supporter jusqu'à 20 kg par cheville sans perçage lourd."
    ]
  },
  {
    id: 'post-ratissage-finition-peinture',
    slug: 'ratissage-lissage-enduit-preparation-plafond-peinture-bassin-arcachon',
    title: 'Ratissage et enduit de lissage : La clé d\'un plafond parfaitement lisse avant peinture',
    category: 'Ratissage & Finition Peinture',
    excerpt: 'Pourquoi le ratissage complet à l\'enduit est indispensable pour supprimer le spectre des plaques et réussir un rendu peinture mate ou satinée.',
    readingTime: '4 min de lecture',
    date: 'Juillet 2026',
    author: 'Conseils Plâtrerie • Bassin d\'Arcachon',
    imageUrl: DEFAULT_GALLERY_IMAGES[4]?.url || DEFAULT_GALLERY_IMAGES[0]?.url || '',
    content: [
      "Vous observez des bandes visibles ou des ombres au niveau des joints lorsque la lumière du soir entre par la baie vitrée ? Le ratissage est la solution professionnelle pour obtenir un aspect plâtre uniforme.",
      "### Qu'est-ce que le ratissage de plafond ?",
      "Le ratissage consiste à appliquer une fine pellicule d'enduit de lissage sur l'intégralité du plafond ou du mur, et pas seulement sur la zone des bandes. Cela uniformise la porosité entre la plaque de carton et le plâtre des joints.",
      "### Pourquoi l'impression sous-couche ne suffit pas toujours ?",
      "La plaque de plâtre cartonnée et l'enduit à joint n'ont pas la même absorption de peinture. Sans ratissage complet, la lumière rasante révèle la différence de grain, créant ce qu'on appelle 'le spectre des bandes'.",
      "### Le contrôle à la lampe rasante",
      "Après séchage, un ponçage au papier de verre grain très fin (180 à 220) sous éclairage rasant garantit un support prêt à peindre de niveau Q4 (qualité maximale)."
    ]
  }
];

