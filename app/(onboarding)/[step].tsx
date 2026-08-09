import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Alerte } from '../../components/Alerte';
import { Chip } from '../../components/Chip';
import { Cta } from '../../components/Cta';
import { Steps } from '../../components/Steps';
import { useInvalidationProfil } from '../../hooks/useProfil';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { useOnboardingStore } from '../../store/onboarding';
import { useSessionStore } from '../../store/session';
import { couleurs, espaces, typo } from '../../theme/tokens';

const ETAPES = ['niche', 'plateforme', 'ton'] as const;
type EtapeOnboarding = (typeof ETAPES)[number];

export default function OnboardingEtape() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const etapeActuelle: EtapeOnboarding = ETAPES.includes(step as EtapeOnboarding)
    ? (step as EtapeOnboarding)
    : 'niche';
  const indexEtape = ETAPES.indexOf(etapeActuelle);

  const session = useSessionStore((etat) => etat.session);
  const invaliderProfil = useInvalidationProfil();
  const { niche, plateforme, ton, definirNiche, definirPlateforme, definirTon, reinitialiser } =
    useOnboardingStore();

  const [enEnregistrement, setEnEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const configuration = {
    niche: {
      titre: strings.onboarding.titreNiche,
      options: strings.onboarding.niches,
      valeur: niche,
      definir: definirNiche,
    },
    plateforme: {
      titre: strings.onboarding.titrePlateforme,
      options: strings.onboarding.plateformes,
      valeur: plateforme,
      definir: definirPlateforme,
    },
    ton: {
      titre: strings.onboarding.titreTon,
      options: strings.onboarding.tons,
      valeur: ton,
      definir: definirTon,
    },
  } as const;

  const { titre, options, valeur, definir } = configuration[etapeActuelle];

  async function suivant() {
    if (!valeur) return;

    if (indexEtape < ETAPES.length - 1) {
      router.push(`/(onboarding)/${ETAPES[indexEtape + 1]}`);
      return;
    }

    if (!session || !niche || !plateforme || !ton) return;

    setErreur(null);
    setEnEnregistrement(true);
    const { error } = await supabase
      .from('profiles')
      .update({ niche, plateforme, ton, onboarded: true })
      .eq('id', session.user.id);
    setEnEnregistrement(false);

    if (error) {
      setErreur(strings.onboarding.erreurEnregistrement);
      return;
    }

    reinitialiser();
    await invaliderProfil();
    // La garde de session (Stack.Protected) redirige automatiquement vers
    // (app) dès que le profil rechargé a onboarded === true.
  }

  return (
    <SafeAreaView style={styles.conteneur} edges={['top', 'bottom']}>
      <Steps total={ETAPES.length} actuel={indexEtape} />

      {indexEtape > 0 ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.boutonRetour}
        >
          <Text style={styles.texteRetour}>{strings.onboarding.retour}</Text>
        </Pressable>
      ) : null}

      <View style={styles.entete}>
        <Text style={typo.grandTitre}>{titre}</Text>
        <Text style={[typo.corps, styles.sousTitre]}>{strings.onboarding.sousTitre}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.optionsConteneur}>
        {options.map((option) => (
          <Chip
            key={option}
            libelle={option}
            selectionne={valeur === option}
            onPress={() => definir(option)}
          />
        ))}
      </ScrollView>

      {erreur ? <Alerte message={erreur} /> : null}

      <Cta
        libelle={indexEtape < ETAPES.length - 1 ? strings.onboarding.continuer : strings.onboarding.terminer}
        onPress={suivant}
        desactive={!valeur}
        chargement={enEnregistrement}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
    padding: espaces.l,
    paddingTop: espaces.xl,
    gap: espaces.l,
  },
  boutonRetour: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  texteRetour: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 14,
    color: couleurs.craie,
  },
  entete: {
    gap: espaces.s,
  },
  sousTitre: {
    color: couleurs.gris,
  },
  optionsConteneur: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaces.s,
    flexGrow: 1,
  },
});
