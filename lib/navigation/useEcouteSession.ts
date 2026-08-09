import { useEffect } from 'react';

import { supabase } from '../supabase/client';
import { useSessionStore } from '../../store/session';

// Point d'entrée unique de l'état d'authentification Supabase vers le store
// global. À monter une seule fois, à la racine de l'app.
export function useEcouteSession() {
  const definirSession = useSessionStore((etat) => etat.definirSession);
  const marquerPret = useSessionStore((etat) => etat.marquerPret);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      definirSession(data.session);
      marquerPret();
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
      definirSession(session);
    });

    return () => abonnement.subscription.unsubscribe();
  }, [definirSession, marquerPret]);
}
