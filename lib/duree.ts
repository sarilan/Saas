export const BUDGET_ORAL_SECONDES = 3;

const MOTS_PAR_SECONDE = 2.8;
const DUREE_MIN_SECONDES = 0.6;

export function compterMots(texte: string): number {
  return texte.trim().split(/\s+/).filter(Boolean).length;
}

export function calculerDureeSecondes(texte: string): number {
  return Math.max(DUREE_MIN_SECONDES, compterMots(texte) / MOTS_PAR_SECONDE);
}

export function formaterDuree(secondes: number): string {
  return `${secondes.toFixed(1).replace('.', ',')} s`;
}

export function estDansLeBudget(secondes: number): boolean {
  return secondes <= BUDGET_ORAL_SECONDES;
}
