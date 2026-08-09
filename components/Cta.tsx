import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { cibleTactileMin, couleurs, espaces, polices, rayons } from '../theme/tokens';

type CtaProps = {
  libelle: string;
  onPress: () => void;
  variante?: 'primaire' | 'secondaire';
  desactive?: boolean;
  chargement?: boolean;
  accessibilityLabel?: string;
};

export function Cta({
  libelle,
  onPress,
  variante = 'primaire',
  desactive = false,
  chargement = false,
  accessibilityLabel,
}: CtaProps) {
  const indisponible = desactive || chargement;

  return (
    <Pressable
      onPress={indisponible ? undefined : onPress}
      disabled={indisponible}
      accessibilityRole="button"
      accessibilityState={{ disabled: indisponible, busy: chargement }}
      accessibilityLabel={accessibilityLabel ?? libelle}
      style={({ pressed }) => [
        styles.base,
        variante === 'primaire' ? styles.primaire : styles.secondaire,
        indisponible && styles.desactive,
        pressed && !indisponible && styles.pressee,
      ]}
    >
      {chargement ? (
        <ActivityIndicator color={variante === 'primaire' ? couleurs.nuit : couleurs.craie} />
      ) : (
        <Text style={[styles.libelle, variante === 'secondaire' && styles.libelleSecondaire]}>
          {libelle}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: cibleTactileMin,
    borderRadius: rayons.champ,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaces.l,
    width: '100%',
  },
  primaire: {
    backgroundColor: couleurs.violet,
  },
  secondaire: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: couleurs.ligne,
  },
  desactive: {
    opacity: 0.45,
  },
  pressee: {
    opacity: 0.85,
  },
  libelle: {
    fontFamily: polices.demiGras,
    fontSize: 16,
    color: couleurs.nuit,
  },
  libelleSecondaire: {
    color: couleurs.craie,
  },
});
