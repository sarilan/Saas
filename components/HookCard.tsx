import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { calculerDureeSecondes, formaterDuree } from '../lib/duree';
import { strings } from '../lib/i18n';
import { couleurs, espaces, polices, typo } from '../theme/tokens';
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

  return (
    <Pressable
      onPress={copier}
      onLongPress={onSignaler}
      delayLongPress={450}
      accessibilityRole="button"
      accessibilityLabel={`${texte}. ${strings.hookCard.astuceCopie}`}
      style={({ pressed }) => [styles.carte, pressed && styles.pressee]}
    >
      <Text style={typo.accroche}>{texte}</Text>
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
          accessibilityLabel={`${strings.hookCard.dureeOrale} ${formaterDuree(duree)}`}
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
