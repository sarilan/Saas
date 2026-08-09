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
      <Text style={styles.libelle}>{libelle}</Text>
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
});
