// Source unique des jetons de design. Ne jamais coder une couleur, un rayon,
// un espace ou une police en dur ailleurs dans l'app : importer depuis ce fichier.

export const couleurs = {
  nuit: '#121018',
  scene: '#1A1826',
  ligne: '#2B2740',
  craie: '#ECEAF5',
  gris: '#8B87A3',
  // Ajusté de #7B61FF à #8167FF (étape 11) : le violet brief ne passait le
  // texte `nuit` qu'à 4,49:1 sur ce fond, sous le seuil de 4,5:1 exigé par
  // le plancher de qualité. Ce nuancé, à peine perceptible, ramène le
  // contraste texte `nuit`/fond violet à 4,78:1, vérifié par calcul.
  violet: '#8167FF',
  // `violet` en texte/icône sur fond sombre ne passe qu'à ~4,15:1 (sous le
  // seuil de 4,5:1) : cette variante plus claire est réservée à cet usage
  // (ex. onglet actif), jamais comme fond — voir la note de l'étape 11.
  violetClair: '#A08CFF',
  ambre: '#FFB020',
  alerteFond: '#2A1620',
  alerteBord: '#5A2438',
  alerteTexte: '#FFB3C4',
} as const;

export const rayons = {
  champ: 14,
  puce: 999,
  feuille: 22,
} as const;

export const espaces = {
  xs: 6,
  s: 10,
  m: 14,
  l: 20,
  xl: 26,
} as const;

export const polices = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  demiGras: 'Archivo_600SemiBold',
  gras: 'Archivo_800ExtraBold',
  mono: 'SpaceMono_400Regular',
} as const;

// `lineHeight` est volontairement omis ci-dessous (sauf ratio explicite du
// brief pour `accroche`) : une valeur fixe en points ne suit pas la mise à
// l'échelle Dynamic Type du texte et finit par tronquer les lignes aux
// plus grandes tailles d'accessibilité. Laisser React Native calculer
// l'interligne naturel du glyphe scale correctement avec la taille de
// police système (plancher de qualité, section 3).
export const typo = {
  grandTitre: {
    fontFamily: polices.gras,
    fontSize: 29,
    letterSpacing: -0.035 * 29,
    color: couleurs.craie,
  },
  titre: {
    fontFamily: polices.demiGras,
    fontSize: 20,
    color: couleurs.craie,
  },
  corps: {
    fontFamily: polices.regular,
    fontSize: 15,
    color: couleurs.craie,
  },
  accroche: {
    fontFamily: polices.demiGras,
    fontSize: 17,
    color: couleurs.craie,
  },
  microLibelle: {
    fontFamily: polices.mono,
    fontSize: 11,
    letterSpacing: 0.18 * 11,
    textTransform: 'uppercase' as const,
    color: couleurs.gris,
  },
} as const;

// Ratio d'interligne imposé par le brief pour le texte des accroches
// (section 3 : « Archivo 600, 17 px, interligne 1.34 »). Calculé à l'usage
// (HookCard) via PixelRatio.getFontScale(), pour rester exact au lancement
// avec une taille d'accessibilité déjà réglée plutôt que fixé en points.
export const RATIO_INTERLIGNE_ACCROCHE = 1.34;

// Cible tactile minimale imposée par le plancher de qualité (HIG + accessibilité).
export const cibleTactileMin = 44;

export const dureeAnimation = {
  courte: 160,
  moyenne: 260,
  cascade: 30,
} as const;
