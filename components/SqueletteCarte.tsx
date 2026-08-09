import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { couleurs, espaces } from '../theme/tokens';

export function SqueletteCarte() {
  const opacite = useSharedValue(0.5);

  useEffect(() => {
    opacite.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1
    );
  }, [opacite]);

  const styleAnime = useAnimatedStyle(() => ({ opacity: opacite.value }));

  return (
    <Animated.View style={[styles.carte, styleAnime]}>
      <View style={styles.ligneTexte} />
      <View style={[styles.ligneTexte, styles.ligneTexteCourte]} />
      <View style={styles.outils} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.scene,
    borderRadius: 18,
    padding: espaces.l,
    gap: espaces.m,
  },
  ligneTexte: {
    height: 14,
    borderRadius: 7,
    backgroundColor: couleurs.ligne,
  },
  ligneTexteCourte: {
    width: '60%',
  },
  outils: {
    height: 20,
    borderRadius: 10,
    backgroundColor: couleurs.ligne,
  },
});
