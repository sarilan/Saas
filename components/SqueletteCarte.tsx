import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '../hooks/useReduceMotion';
import { couleurs, espaces } from '../theme/tokens';

export function SqueletteCarte() {
  const opacite = useSharedValue(0.5);
  const reduireMouvement = useReduceMotion();

  useEffect(() => {
    if (reduireMouvement) {
      // Pas de pulsation continue pour les utilisateurs sensibles au mouvement :
      // une opacité fixe, ni pleine ni vide, suffit à signaler un chargement.
      opacite.value = 0.75;
      return;
    }
    opacite.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1
    );
  }, [opacite, reduireMouvement]);

  const styleAnime = useAnimatedStyle(() => ({ opacity: opacite.value }));

  return (
    <Animated.View
      style={[styles.carte, styleAnime]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
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
