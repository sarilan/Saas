import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { AccessibilityActionEvent } from 'react-native';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';

import { BUDGET_ORAL_SECONDES, calculerDureeSecondes, formaterDuree } from '../lib/duree';
import { strings } from '../lib/i18n';
import { RATIO_INTERLIGNE_ACCROCHE, couleurs, espaces, polices, typo } from '../theme/tokens';
import { Meter } from './Meter';
import { useToast } from './Toast';

type HookCardProps = {
  texte: string;
  enFavori: boolean;
  onToggleFavori: () => void;
  onSignaler: () => void;
  index?: number;
  animer?: boolean;
};

export function HookCard({
  texte,
  enFavori,
  onToggleFavori,
  onSignaler,
  index = 0,
  animer = true,
}: HookCardProps) {
  const { afficherToast } = useToast();
  const duree = calculerDureeSecondes(texte);

  async function copier() {
    await Clipboard.setStringAsync(texte);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    afficherToast(strings.hookCard.copie);
  }

  async function basculerFavori() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavori();
  }

  // La carte est un seul élément VoiceOver opaque (accessible={true}) : ses
  // enfants (étoile, barre de durée) ne seraient de toute façon pas
  // atteignables individuellement par balayage. Le favori et le
  // signalement sont donc exposés comme actions d'accessibilité (rotor),
  // avec un label qui porte toute l'information sinon donnée visuellement
  // par la barre de durée voisine.
  function gererActionAccessibilite(evenement: AccessibilityActionEvent) {
    if (evenement.nativeEvent.actionName === 'favori') {
      basculerFavori();
    } else if (evenement.nativeEvent.actionName === 'signaler') {
      onSignaler();
    }
  }

  const dansLeBudget = duree <= BUDGET_ORAL_SECONDES;
  const labelAccessible = [
    texte,
    `${strings.hookCard.dureeOrale} ${formaterDuree(duree)}`,
    dansLeBudget ? 'dans le budget de 3 secondes' : 'au-delà du budget de 3 secondes',
    enFavori ? strings.hookCard.retirerFavori : strings.hookCard.ajouterFavori,
  ].join('. ');

  return (
    <Pressable
      onPress={copier}
      onLongPress={onSignaler}
      delayLongPress={450}
      accessible
      accessibilityRole="button"
      accessibilityLabel={labelAccessible}
      accessibilityHint={strings.hookCard.astuceCopie}
      accessibilityActions={[
        { name: 'favori', label: enFavori ? strings.hookCard.retirerFavori : strings.hookCard.ajouterFavori },
        { name: 'signaler', label: strings.signalement.titre },
      ]}
      onAccessibilityAction={gererActionAccessibilite}
      style={({ pressed }) => [styles.carte, pressed && styles.pressee]}
    >
      <Text
        style={[
          typo.accroche,
          { lineHeight: typo.accroche.fontSize * RATIO_INTERLIGNE_ACCROCHE * PixelRatio.getFontScale() },
        ]}
      >
        {texte}
      </Text>
      <View style={styles.outils}>
        <Pressable
          onPress={basculerFavori}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityState={{ selected: enFavori }}
          accessibilityLabel={
            enFavori ? strings.hookCard.retirerFavori : strings.hookCard.ajouterFavori
          }
          style={styles.boutonEtoile}
        >
          <Ionicons
            name={enFavori ? 'star' : 'star-outline'}
            size={20}
            color={enFavori ? couleurs.ambre : couleurs.gris}
          />
        </Pressable>
        <Meter dureeSecondes={duree} indexCascade={index} animer={animer} />
        <Text
          style={styles.duree}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {formaterDuree(duree)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.scene,
    borderRadius: 18,
    padding: espaces.l,
    gap: espaces.m,
  },
  pressee: {
    opacity: 0.9,
  },
  outils: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.s,
  },
  boutonEtoile: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -espaces.s,
  },
  duree: {
    fontFamily: polices.mono,
    fontSize: 11,
    color: couleurs.craie,
    minWidth: 44,
    textAlign: 'right',
  },
});
