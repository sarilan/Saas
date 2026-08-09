import { create } from 'zustand';

type EtatOnboarding = {
  niche: string | null;
  plateforme: string | null;
  ton: string | null;
  definirNiche: (valeur: string) => void;
  definirPlateforme: (valeur: string) => void;
  definirTon: (valeur: string) => void;
  reinitialiser: () => void;
};

export const useOnboardingStore = create<EtatOnboarding>((set) => ({
  niche: null,
  plateforme: null,
  ton: null,
  definirNiche: (niche) => set({ niche }),
  definirPlateforme: (plateforme) => set({ plateforme }),
  definirTon: (ton) => set({ ton }),
  reinitialiser: () => set({ niche: null, plateforme: null, ton: null }),
}));
