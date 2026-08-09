import { Pressable, StyleSheet, Text } from 'react-native';

import { cibleTactileMin, couleurs, espaces, polices, rayons } from '../theme/tokens';

type ChipProps = {
  libelle: string;
  selectionne: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function Chip({ libelle, selectionne, onPress, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selectionne }}
      accessibilityLabel={accessibilityLabel ?? libelle}
      style={({ pressed }) => [
        styles.puce,
        selectionne ? styles.puceActive : styles.puceInactive,
        pressed && styles.pressee,
      ]}
    >
      <Text style={[styles.libelle, selectionne && styles.libelleActif]}>{libelle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: {
    minHeight: cibleTactileMin,
    paddingHorizontal: espaces.m,
    borderRadius: rayons.puce,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  puceInactive: {
    borderColor: couleurs.ligne,
    backgroundColor: 'transparent',
  },
  puceActive: {
    borderColor: couleurs.violet,
    backgroundColor: couleurs.violet,
  },
  pressee: {
    opacity: 0.85,
  },
  libelle: {
    fontFamily: polices.medium,
    fontSize: 14,
    color: couleurs.craie,
  },
  // Sur fond violet, craie ne passe qu'à 3,5:1 (sous le seuil de 4,5:1) : nuit
  // est le seul texte qui reste conforme sur ce fond (même choix que Cta).
  libelleActif: {
    color: couleurs.nuit,
  },
});
