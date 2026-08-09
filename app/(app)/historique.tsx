import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useHistorique } from '../../hooks/useHistorique';
import { strings } from '../../lib/i18n';
import { formaterDateRelative } from '../../lib/date';
import { useRepriseStore } from '../../store/reprise';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

export default function Historique() {
  const { data: generations } = useHistorique();
  const definirReprise = useRepriseStore((etat) => etat.definirReprise);

  function reprendre(generation: NonNullable<typeof generations>[number]) {
    const hooks = Array.isArray(generation.hooks)
      ? generation.hooks.filter((item): item is string => typeof item === 'string')
      : [];

    definirReprise({
      sujet: generation.sujet,
      plateforme: generation.plateforme,
      ton: generation.ton,
      hooks,
    });
    router.navigate('/(app)/creer');
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={typo.titre}>{strings.onglets.historique}</Text>
      </View>

      {generations && generations.length > 0 ? (
        <View style={styles.liste}>
          {generations.map((generation) => (
            <Pressable
              key={generation.id}
              onPress={() => reprendre(generation)}
              accessibilityRole="button"
              accessibilityLabel={generation.sujet}
              style={({ pressed }) => [styles.carte, pressed && styles.cartePressee]}
            >
              <Text style={typo.corps} numberOfLines={2}>
                {generation.sujet}
              </Text>
              <Text style={styles.meta}>
                {generation.plateforme} · {generation.ton} ·{' '}
                {strings.historique.accrochesCount(
                  Array.isArray(generation.hooks) ? generation.hooks.length : 0
                )}{' '}
                · {formaterDateRelative(generation.created_at)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.etatVide}>
          <Text style={typo.titre}>{strings.historique.etatVideTitre}</Text>
          <Text style={[typo.corps, styles.etatVideTexte]}>
            {strings.historique.etatVideTexte}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  entete: {
    paddingHorizontal: espaces.l,
    paddingTop: espaces.xl,
    paddingBottom: espaces.m,
  },
  liste: {
    padding: espaces.l,
    paddingTop: 0,
    gap: espaces.m,
  },
  carte: {
    minHeight: 44,
    backgroundColor: couleurs.scene,
    borderRadius: rayons.champ,
    padding: espaces.m,
    gap: espaces.s,
  },
  cartePressee: {
    opacity: 0.85,
  },
  meta: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  etatVide: {
    gap: espaces.s,
    padding: espaces.l,
    paddingTop: espaces.xl,
  },
  etatVideTexte: {
    color: couleurs.gris,
  },
});
