import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '../hooks/useReduceMotion';
import { BUDGET_ORAL_SECONDES, formaterDuree } from '../lib/duree';
import { strings } from '../lib/i18n';
import { couleurs, dureeAnimation } from '../theme/tokens';

// Échelle visuelle du repère : deux fois le budget, pour que le dépassement reste lisible
// sans que la barre sature dès qu'une accroche dépasse 3 s.
const PLAGE_MAX_SECONDES = BUDGET_ORAL_SECONDES * 2;

type MeterProps = {
  dureeSecondes: number;
  indexCascade?: number;
  animer?: boolean;
};

export function Meter({ dureeSecondes, indexCascade = 0, animer = true }: MeterProps) {
  const reduireMouvement = useReduceMotion();
  const animerReellement = animer && !reduireMouvement;

  const progression = useSharedValue(0);
  const cible = Math.min(dureeSecondes / PLAGE_MAX_SECONDES, 1);
  const dansLeBudget = dureeSecondes <= BUDGET_ORAL_SECONDES;

  useEffect(() => {
    if (!animerReellement) {
      progression.value = cible;
      return;
    }
    progression.value = withDelay(
      indexCascade * dureeAnimation.cascade,
      withTiming(cible, { duration: dureeAnimation.moyenne })
    );
  }, [cible, animerReellement, indexCascade, progression]);

  const styleAnime = useAnimatedStyle(() => ({
    width: `${progression.value * 100}%`,
  }));

  return (
    <View
      style={styles.piste}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={strings.hookCard.dureeOrale}
      accessibilityValue={{ text: formaterDuree(dureeSecondes) }}
    >
      <Animated.View
        style={[
          styles.remplissage,
          { backgroundColor: dansLeBudget ? couleurs.violet : couleurs.ambre },
          styleAnime,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: {
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligne,
    overflow: 'hidden',
    flex: 1,
  },
  remplissage: {
    height: '100%',
    borderRadius: 2,
  },
});
