import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { strings } from '../lib/i18n';
import { couleurs, espaces, typo } from '../theme/tokens';

export default function Confidentialite() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.legal.confidentialiteTitre,
          headerStyle: { backgroundColor: couleurs.nuit },
          headerTintColor: couleurs.craie,
        }}
      />
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        <Text style={typo.grandTitre}>{strings.legal.confidentialiteTitre}</Text>
        {strings.legal.confidentialite.map((paragraphe) => (
          <Text key={paragraphe.slice(0, 24)} style={typo.corps}>
            {paragraphe}
          </Text>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  contenu: {
    padding: espaces.l,
    gap: espaces.l,
    paddingBottom: espaces.xl * 2,
  },
});
