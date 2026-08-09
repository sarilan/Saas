import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

type EtatSession = {
  session: Session | null;
  pretAuthentification: boolean;
  definirSession: (session: Session | null) => void;
  marquerPret: () => void;
};

export const useSessionStore = create<EtatSession>((set) => ({
  session: null,
  pretAuthentification: false,
  definirSession: (session) => set({ session }),
  marquerPret: () => set({ pretAuthentification: true }),
}));
