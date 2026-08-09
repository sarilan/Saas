// Source unique des jetons de design. Ne jamais coder une couleur, un rayon,
// un espace ou une police en dur ailleurs dans l'app : importer depuis ce fichier.

export const couleurs = {
  nuit: '#121018',
  scene: '#1A1826',
  ligne: '#2B2740',
  craie: '#ECEAF5',
  gris: '#8B87A3',
  violet: '#7B61FF',
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

export const typo = {
  grandTitre: {
    fontFamily: polices.gras,
    fontSize: 29,
    letterSpacing: -0.035 * 29,
    lineHeight: 34,
    color: couleurs.craie,
  },
  titre: {
    fontFamily: polices.demiGras,
    fontSize: 20,
    lineHeight: 26,
    color: couleurs.craie,
  },
  corps: {
    fontFamily: polices.regular,
    fontSize: 15,
    lineHeight: 21,
    color: couleurs.craie,
  },
  accroche: {
    fontFamily: polices.demiGras,
    fontSize: 17,
    lineHeight: 17 * 1.34,
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

// Cible tactile minimale imposée par le plancher de qualité (HIG + accessibilité).
export const cibleTactileMin = 44;

export const dureeAnimation = {
  courte: 160,
  moyenne: 260,
  cascade: 30,
} as const;
