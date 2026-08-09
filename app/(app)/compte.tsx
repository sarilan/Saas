import { StyleSheet, Text, View } from 'react-native';

import { Cta } from '../../components/Cta';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { useOnboardingStore } from '../../store/onboarding';
import { couleurs, espaces, typo } from '../../theme/tokens';

export default function Compte() {
  async function seDeconnecter() {
    await supabase.auth.signOut();
    useOnboardingStore.getState().reinitialiser();
  }

  return (
    <View style={styles.conteneur}>
      <Text style={typo.titre}>{strings.onglets.compte}</Text>
      <View style={styles.action}>
        <Cta libelle={strings.compte.deconnexion} variante="secondaire" onPress={seDeconnecter} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaces.l,
    gap: espaces.xl,
  },
  action: {
    width: '100%',
  },
});
