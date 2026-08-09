import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';

import { HookCard } from '../../components/HookCard';
import { Cta } from '../../components/Cta';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { useBasculerFavori, useFavoris } from '../../hooks/useFavoris';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { useSessionStore } from '../../store/session';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

export default function Favoris() {
  const session = useSessionStore((etat) => etat.session);
  const { data: favoris } = useFavoris();
  const basculerFavori = useBasculerFavori();
  const { afficherToast } = useToast();
  const [accrocheSignalee, setAccrocheSignalee] = useState<string | null>(null);

  async function envoyerSignalement() {
    if (!session || !accrocheSignalee) return;
    await supabase
      .from('signalements')
      .insert({ user_id: session.user.id, texte: accrocheSignalee, motif: null });
    setAccrocheSignalee(null);
    afficherToast(strings.signalement.confirmation);
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={typo.titre}>{strings.onglets.favoris}</Text>
      </View>

      {favoris && favoris.length > 0 ? (
        <View style={styles.liste}>
          {favoris.map((favori, index) => (
            <Animated.View key={favori.id} exiting={FadeOut.duration(160)}>
              <Swipeable
                renderRightActions={() => (
                  <Pressable
                    onPress={() => basculerFavori.mutate({ texte: favori.texte, enFavori: true })}
                    accessibilityRole="button"
                    accessibilityLabel={strings.favoris.retirer}
                    style={styles.actionSupprimer}
                  >
                    <Text style={styles.texteActionSupprimer}>{strings.favoris.retirer}</Text>
                  </Pressable>
                )}
              >
                <HookCard
                  texte={favori.texte}
                  index={index}
                  enFavori
                  onToggleFavori={() =>
                    basculerFavori.mutate({ texte: favori.texte, enFavori: true })
                  }
                  onSignaler={() => setAccrocheSignalee(favori.texte)}
                />
              </Swipeable>
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.etatVide}>
          <Text style={typo.titre}>{strings.favoris.etatVideTitre}</Text>
          <Text style={[typo.corps, styles.etatVideTexte]}>{strings.favoris.etatVideTexte}</Text>
        </View>
      )}

      <Sheet
        visible={accrocheSignalee !== null}
        onClose={() => setAccrocheSignalee(null)}
        accessibilityLabel={strings.signalement.titre}
      >
        <Text style={typo.titre}>{strings.signalement.titre}</Text>
        <Text style={[typo.corps, styles.texteSheet]}>{strings.signalement.motifIntro}</Text>
        <Cta libelle={strings.signalement.confirmer} onPress={envoyerSignalement} />
        <View style={styles.espaceur} />
        <Cta
          libelle={strings.signalement.annuler}
          variante="secondaire"
          onPress={() => setAccrocheSignalee(null)}
        />
      </Sheet>
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
  actionSupprimer: {
    backgroundColor: couleurs.alerteFond,
    borderColor: couleurs.alerteBord,
    borderWidth: 1,
    borderRadius: rayons.champ,
    minWidth: 88,
    marginLeft: espaces.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteActionSupprimer: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 14,
    color: couleurs.alerteTexte,
  },
  etatVide: {
    gap: espaces.s,
    padding: espaces.l,
    paddingTop: espaces.xl,
  },
  etatVideTexte: {
    color: couleurs.gris,
  },
  texteSheet: {
    marginTop: espaces.s,
    marginBottom: espaces.l,
  },
  espaceur: {
    height: espaces.s,
  },
});
