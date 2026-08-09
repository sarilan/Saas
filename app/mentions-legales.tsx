import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { strings } from '../lib/i18n';
import { couleurs, espaces, typo } from '../theme/tokens';

export default function MentionsLegales() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.legal.cguTitre,
          headerStyle: { backgroundColor: couleurs.nuit },
          headerTintColor: couleurs.craie,
        }}
      />
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        <Text style={typo.grandTitre}>{strings.legal.cguTitre}</Text>
        {strings.legal.cgu.map((paragraphe) => (
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
