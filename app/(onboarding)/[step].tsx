import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espaces, typo } from '../../theme/tokens';

export default function OnboardingEtape() {
  const { step } = useLocalSearchParams<{ step: string }>();

  return (
    <View style={styles.conteneur}>
      <Text style={typo.titre}>Onboarding — étape {step}</Text>
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
  },
});
