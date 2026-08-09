import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Plancher de qualité (brief section 3) : « prefers-reduced-motion honoré,
// animations coupées, pas seulement raccourcies ». Les composants animés
// lisent ce booléen et sautent directement à la valeur finale au lieu de
// réduire la durée d'une transition.
export function useReduceMotion(): boolean {
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    let monte = true;

    AccessibilityInfo.isReduceMotionEnabled().then((valeur) => {
      if (monte) setReduit(valeur);
    });

    const abonnement = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduit);

    return () => {
      monte = false;
      abonnement.remove();
    };
  }, []);

  return reduit;
}
