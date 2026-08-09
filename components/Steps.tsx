import { StyleSheet, View } from 'react-native';

import { couleurs, espaces } from '../theme/tokens';

type StepsProps = {
  total: number;
  actuel: number;
};

export function Steps({ total, actuel }: StepsProps) {
  return (
    <View
      style={styles.ligne}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: actuel + 1 }}
      accessibilityLabel={`Étape ${actuel + 1} sur ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.segment, index <= actuel ? styles.segmentRempli : styles.segmentVide]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    gap: espaces.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentVide: {
    backgroundColor: couleurs.ligne,
  },
  segmentRempli: {
    backgroundColor: couleurs.violet,
  },
});
