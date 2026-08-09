import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cta } from '../../components/Cta';
import { useToast } from '../../components/Toast';
import { useInvalidationProfil, useProfil } from '../../hooks/useProfil';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { restaurerAchats } from '../../lib/purchases';
import { useOnboardingStore } from '../../store/onboarding';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

const URL_GESTION_ABONNEMENT_APPLE = 'itms-apps://apps.apple.com/account/subscriptions';

export default function Compte() {
  const { data: profil } = useProfil();
  const invaliderProfil = useInvalidationProfil();
  const { afficherToast } = useToast();

  const restaurationMutation = useMutation({
    mutationFn: restaurerAchats,
    onSuccess: async (customerInfo) => {
      const aUnAbonnementActif = Object.keys(customerInfo.entitlements.active).length > 0;
      afficherToast(
        aUnAbonnementActif ? strings.paywall.restaurationReussie : strings.paywall.restaurationVide
      );
      await invaliderProfil();
    },
  });

  async function seDeconnecter() {
    await supabase.auth.signOut();
    useOnboardingStore.getState().reinitialiser();
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={typo.grandTitre}>{strings.onglets.compte}</Text>

      <View style={styles.section}>
        <Text style={styles.titreSection}>{strings.compteAbonnement.titre}</Text>
        <Text style={typo.corps}>
          {profil?.abonnement_actif
            ? strings.compteAbonnement.statutPro
            : strings.compteAbonnement.statutGratuit}
        </Text>

        {profil?.abonnement_actif ? (
          <Cta
            libelle={strings.compteAbonnement.gerer}
            variante="secondaire"
            onPress={() => Linking.openURL(URL_GESTION_ABONNEMENT_APPLE)}
          />
        ) : (
          <Cta
            libelle={strings.compteAbonnement.sAbonner}
            onPress={() => router.push('/paywall')}
          />
        )}

        <Cta
          libelle={strings.compteAbonnement.restaurer}
          variante="secondaire"
          onPress={() => restaurationMutation.mutate()}
          chargement={restaurationMutation.isPending}
        />
      </View>

      <View style={styles.section}>
        <Cta libelle={strings.compte.deconnexion} variante="secondaire" onPress={seDeconnecter} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  contenu: {
    padding: espaces.l,
    paddingTop: espaces.xl,
    gap: espaces.xl,
    paddingBottom: espaces.xl * 2,
  },
  section: {
    gap: espaces.m,
    backgroundColor: couleurs.scene,
    borderRadius: rayons.champ,
    padding: espaces.l,
  },
  titreSection: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
});
