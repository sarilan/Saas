import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Alerte } from '../../components/Alerte';
import { Chip } from '../../components/Chip';
import { Cta } from '../../components/Cta';
import { HookCard } from '../../components/HookCard';
import { Sheet } from '../../components/Sheet';
import { SqueletteCarte } from '../../components/SqueletteCarte';
import { useToast } from '../../components/Toast';
import { useInvalidationProfil, useProfil } from '../../hooks/useProfil';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { genererAccroches } from '../../lib/supabase/generate';
import { useSessionStore } from '../../store/session';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

const NOMBRE_SQUELETTES = 3;

export default function Creer() {
  const session = useSessionStore((etat) => etat.session);
  const { data: profil } = useProfil();
  const invaliderProfil = useInvalidationProfil();
  const { afficherToast } = useToast();

  const [sujet, setSujet] = useState('');
  const [plateforme, setPlateforme] = useState<string | null>(profil?.plateforme ?? null);
  const [ton, setTon] = useState<string | null>(profil?.ton ?? null);
  const [resultats, setResultats] = useState<string[]>([]);
  const [favorisLocaux, setFavorisLocaux] = useState<Record<string, boolean>>({});
  const [accrocheSignalee, setAccrocheSignalee] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: genererAccroches,
    onSuccess: async (hooks) => {
      setResultats(hooks);
      setFavorisLocaux({});
      await invaliderProfil();
    },
  });

  const quotaEpuise = Boolean(
    profil && !profil.abonnement_actif && profil.generations_restantes <= 0
  );

  const exemple = profil?.niche
    ? (strings.creer.exemplesParNiche[profil.niche] ?? strings.creer.exempleParDefaut)
    : strings.creer.exempleParDefaut;

  function lancerGeneration() {
    if (!sujet.trim() || !plateforme || !ton || quotaEpuise) return;
    mutation.mutate({ sujet: sujet.trim(), plateforme, ton });
  }

  async function envoyerSignalement() {
    if (!session || !accrocheSignalee) return;
    await supabase
      .from('signalements')
      .insert({ user_id: session.user.id, texte: accrocheSignalee, motif: null });
    setAccrocheSignalee(null);
    afficherToast(strings.signalement.confirmation);
  }

  const messageErreur = quotaEpuise
    ? null
    : mutation.error instanceof Error
      ? mutation.error.message
      : null;

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={typo.titre}>{strings.creer.titre}</Text>
        <Text style={styles.compteur}>
          {profil?.abonnement_actif
            ? strings.creer.illimite
            : strings.creer.generationsRestantes(profil?.generations_restantes ?? 0)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <View style={styles.champConteneur}>
          <Text style={styles.libelleChamp}>{strings.creer.sujetLabel}</Text>
          <TextInput
            value={sujet}
            onChangeText={setSujet}
            placeholder={exemple}
            placeholderTextColor={couleurs.gris}
            multiline
            style={styles.champSujet}
            accessibilityLabel={strings.creer.sujetLabel}
          />
        </View>

        <View style={styles.champConteneur}>
          <Text style={styles.libelleChamp}>{strings.creer.plateformeLabel}</Text>
          <View style={styles.rangeeChips}>
            {strings.onboarding.plateformes.map((option) => (
              <Chip
                key={option}
                libelle={option}
                selectionne={plateforme === option}
                onPress={() => setPlateforme(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.champConteneur}>
          <Text style={styles.libelleChamp}>{strings.creer.tonLabel}</Text>
          <View style={styles.rangeeChips}>
            {strings.onboarding.tons.map((option) => (
              <Chip
                key={option}
                libelle={option}
                selectionne={ton === option}
                onPress={() => setTon(option)}
              />
            ))}
          </View>
        </View>

        <Cta
          libelle={resultats.length > 0 ? strings.creer.genererEncore : strings.creer.generer}
          onPress={lancerGeneration}
          chargement={mutation.isPending}
          desactive={!sujet.trim() || !plateforme || !ton || quotaEpuise}
        />

        {messageErreur ? <Alerte message={messageErreur} /> : null}
        {quotaEpuise ? <Alerte message={strings.creer.quotaEpuise} /> : null}

        <View style={styles.resultats}>
          {mutation.isPending ? (
            Array.from({ length: NOMBRE_SQUELETTES }).map((_, index) => (
              <SqueletteCarte key={index} />
            ))
          ) : resultats.length > 0 ? (
            resultats.map((texte, index) => (
              <HookCard
                key={texte}
                texte={texte}
                index={index}
                enFavori={Boolean(favorisLocaux[texte])}
                onToggleFavori={() =>
                  setFavorisLocaux((precedent) => ({ ...precedent, [texte]: !precedent[texte] }))
                }
                onSignaler={() => setAccrocheSignalee(texte)}
              />
            ))
          ) : (
            <View style={styles.etatVide}>
              <Text style={typo.titre}>{strings.creer.etatVideTitre}</Text>
              <Text style={[typo.corps, styles.etatVideTexte]}>
                {strings.creer.etatVideTexte}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  compteur: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  contenu: {
    padding: espaces.l,
    paddingTop: 0,
    gap: espaces.l,
    paddingBottom: espaces.xl * 2,
  },
  champConteneur: {
    gap: espaces.s,
  },
  libelleChamp: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  champSujet: {
    minHeight: 96,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.scene,
    color: couleurs.craie,
    padding: espaces.m,
    fontFamily: typo.corps.fontFamily,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  rangeeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaces.s,
  },
  resultats: {
    gap: espaces.m,
  },
  etatVide: {
    gap: espaces.s,
    paddingVertical: espaces.xl,
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
