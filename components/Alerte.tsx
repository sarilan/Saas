import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espaces, polices, rayons } from '../theme/tokens';

type AlerteProps = {
  message: string;
};

export function Alerte({ message }: AlerteProps) {
  return (
    <View style={styles.conteneur} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.texte}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: couleurs.alerteFond,
    borderColor: couleurs.alerteBord,
    borderWidth: 1,
    borderRadius: rayons.champ,
    padding: espaces.m,
  },
  texte: {
    fontFamily: polices.medium,
    fontSize: 13,
    color: couleurs.alerteTexte,
  },
});
