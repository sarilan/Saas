import { useEffect } from 'react';
import { Platform } from 'react-native';

import { configurerPurchases, purchasesEstConfigure, synchroniserIdentiteUtilisateur } from '../purchases';
import { useSessionStore } from '../../store/session';

// Configure RevenueCat une seule fois au démarrage, puis aligne son identité
// (`appUserID`) sur l'utilisateur Supabase connecté à chaque changement de
// session — nécessaire pour que le webhook RevenueCat (côté serveur) sache
// à quel profil rattacher un événement d'abonnement.
export function usePurchasesSync() {
  const session = useSessionStore((etat) => etat.session);
  const pretAuthentification = useSessionStore((etat) => etat.pretAuthentification);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    configurerPurchases();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !purchasesEstConfigure() || !pretAuthentification) return;
    synchroniserIdentiteUtilisateur(session?.user.id ?? null).catch((erreur) => {
      console.error('Synchronisation RevenueCat échouée :', erreur);
    });
  }, [session?.user.id, pretAuthentification]);
}
