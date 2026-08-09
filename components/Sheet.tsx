import { ReactNode, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '../hooks/useReduceMotion';
import { couleurs, espaces, rayons } from '../theme/tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
};

const DECALAGE_FERME = 420;
const SEUIL_FERMETURE = 100;

export function Sheet({ visible, onClose, children, accessibilityLabel }: SheetProps) {
  const insets = useSafeAreaInsets();
  const translationY = useSharedValue(DECALAGE_FERME);
  const reduireMouvement = useReduceMotion();
  const dureeTransition = reduireMouvement ? 0 : 220;
  const dureeFermeture = reduireMouvement ? 0 : 200;

  useEffect(() => {
    translationY.value = withTiming(visible ? 0 : DECALAGE_FERME, { duration: dureeTransition });
  }, [visible, translationY, dureeTransition]);

  const geste = Gesture.Pan()
    .onUpdate((evenement) => {
      if (evenement.translationY > 0) {
        translationY.value = evenement.translationY;
      }
    })
    .onEnd((evenement) => {
      if (evenement.translationY > SEUIL_FERMETURE) {
        translationY.value = withTiming(DECALAGE_FERME, { duration: dureeFermeture }, (fini) => {
          if (fini) runOnJS(onClose)();
        });
      } else {
        translationY.value = withTiming(0, { duration: dureeFermeture });
      }
    });

  const styleAnime = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.fond}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      />
      <GestureDetector gesture={geste}>
        <Animated.View
          style={[styles.feuille, { paddingBottom: insets.bottom + espaces.l }, styleAnime]}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.poignee} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 8, 14, 0.6)',
  },
  feuille: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: couleurs.scene,
    borderTopLeftRadius: rayons.feuille,
    borderTopRightRadius: rayons.feuille,
    paddingHorizontal: espaces.l,
    paddingTop: espaces.s,
  },
  poignee: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligne,
    marginBottom: espaces.m,
  },
});
