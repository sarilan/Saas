import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { couleurs, espaces, polices, rayons } from '../theme/tokens';

type ToastContexteValeur = {
  afficherToast: (message: string) => void;
};

const ToastContexte = createContext<ToastContexteValeur | null>(null);

const DUREE_AFFICHAGE_MS = 2200;
const DUREE_TRANSITION_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacite = useSharedValue(0);
  const minuteurCache = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuteurDisparition = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const afficherToast = useCallback(
    (texte: string) => {
      if (minuteurCache.current) clearTimeout(minuteurCache.current);
      if (minuteurDisparition.current) clearTimeout(minuteurDisparition.current);

      setMessage(texte);
      opacite.value = withTiming(1, { duration: DUREE_TRANSITION_MS });

      minuteurCache.current = setTimeout(() => {
        opacite.value = withTiming(0, { duration: DUREE_TRANSITION_MS + 20 });
        minuteurDisparition.current = setTimeout(() => setMessage(null), DUREE_TRANSITION_MS + 40);
      }, DUREE_AFFICHAGE_MS);
    },
    [opacite]
  );

  useEffect(
    () => () => {
      if (minuteurCache.current) clearTimeout(minuteurCache.current);
      if (minuteurDisparition.current) clearTimeout(minuteurDisparition.current);
    },
    []
  );

  const styleAnime = useAnimatedStyle(() => ({
    opacity: opacite.value,
    transform: [{ translateY: (1 - opacite.value) * 12 }],
  }));

  return (
    <ToastContexte.Provider value={{ afficherToast }}>
      {children}
      {message ? (
        <Animated.View
          style={[styles.conteneur, { bottom: insets.bottom + espaces.l }, styleAnime]}
          pointerEvents="none"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.texte}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContexte.Provider>
  );
}

export function useToast(): ToastContexteValeur {
  const contexte = useContext(ToastContexte);
  if (!contexte) {
    throw new Error('useToast doit être appelé à l’intérieur de ToastProvider');
  }
  return contexte;
}

const styles = StyleSheet.create({
  conteneur: {
    position: 'absolute',
    left: espaces.l,
    right: espaces.l,
    backgroundColor: couleurs.scene,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingVertical: espaces.m,
    paddingHorizontal: espaces.l,
    alignItems: 'center',
  },
  texte: {
    fontFamily: polices.medium,
    fontSize: 14,
    color: couleurs.craie,
    textAlign: 'center',
  },
});
