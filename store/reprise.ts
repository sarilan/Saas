import { create } from 'zustand';

export type GenerationAReprendre = {
  sujet: string;
  plateforme: string;
  ton: string;
  hooks: string[];
};

type EtatReprise = {
  generationAReprendre: GenerationAReprendre | null;
  version: number;
  definirReprise: (valeur: GenerationAReprendre) => void;
};

// Pont entre l'écran Historique et l'écran Créer : les deux vivent dans le
// même Tabs et restent montés, un store global est donc plus fiable que des
// params de route pour transporter « sujet, réglages et résultats » d'un tap
// vers l'autre écran (brief section 4, écran Historique). `version`
// s'incrémente à chaque dépôt : Créer compare cette valeur pendant le rendu
// plutôt que dans un effet, pour rester une mise à jour d'état pure.
export const useRepriseStore = create<EtatReprise>((set) => ({
  generationAReprendre: null,
  version: 0,
  definirReprise: (generationAReprendre) =>
    set((etat) => ({ generationAReprendre, version: etat.version + 1 })),
}));
