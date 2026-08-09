import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '../components/Chip';
import { Cta } from '../components/Cta';
import { HookCard } from '../components/HookCard';
import { Sheet } from '../components/Sheet';
import { Steps } from '../components/Steps';
import { useToast } from '../components/Toast';
import { strings } from '../lib/i18n';
import { couleurs, espaces, typo } from '../theme/tokens';

const PLATEFORMES_DEMO = ['TikTok', 'Reels', 'Shorts', 'YouTube'];

const ACCROCHES_DEMO = [
  'Voici trois erreurs qui ruinent tes premières secondes de vidéo.',
  'Personne ne te dit ça avant de lancer ta chaîne, et ça change tout pour la suite.',
  'Arrête de faire ça si tu veux vraiment retenir ton audience dès la première seconde.',
];

export default function Demo() {
  const { afficherToast } = useToast();
  const [plateforme, setPlateforme] = useState(PLATEFORMES_DEMO[0]);
  const [etape, setEtape] = useState(0);
  const [favoris, setFavoris] = useState<Record<number, boolean>>({});
  const [chargement, setChargement] = useState(false);
  const [sheetOuverte, setSheetOuverte] = useState(false);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={typo.grandTitre}>{strings.demo.titre}</Text>

      <Section titre={strings.demo.sousTitrePuces}>
        <View style={styles.rangeePuces}>
          {PLATEFORMES_DEMO.map((item) => (
            <Chip
              key={item}
              libelle={item}
              selectionne={plateforme === item}
              onPress={() => setPlateforme(item)}
            />
          ))}
        </View>
      </Section>

      <Section titre={strings.demo.sousTitreEtapes}>
        <Steps total={3} actuel={etape} />
        <View style={styles.rangeePuces}>
          <Chip libelle="Étape -" selectionne={false} onPress={() => setEtape((e) => Math.max(0, e - 1))} />
          <Chip libelle="Étape +" selectionne={false} onPress={() => setEtape((e) => Math.min(2, e + 1))} />
        </View>
      </Section>

      <Section titre={strings.demo.sousTitreCta}>
        <Cta libelle="Générer 20 accroches" onPress={() => afficherToast('Génération lancée')} />
        <View style={styles.espaceur} />
        <Cta libelle="Restaurer mes achats" variante="secondaire" onPress={() => {}} />
        <View style={styles.espaceur} />
        <Cta libelle="Chargement…" onPress={() => {}} chargement={chargement} />
        <View style={styles.espaceur} />
        <Cta
          libelle="Basculer l'état chargement"
          variante="secondaire"
          onPress={() => setChargement((c) => !c)}
        />
      </Section>

      <Section titre={strings.demo.sousTitreAccroches}>
        {ACCROCHES_DEMO.map((texte, index) => (
          <View key={texte} style={styles.espaceurCarte}>
            <HookCard
              texte={texte}
              index={index}
              enFavori={Boolean(favoris[index])}
              onToggleFavori={() =>
                setFavoris((precedent) => ({ ...precedent, [index]: !precedent[index] }))
              }
              onSignaler={() => setSheetOuverte(true)}
            />
          </View>
        ))}
      </Section>

      <Sheet
        visible={sheetOuverte}
        onClose={() => setSheetOuverte(false)}
        accessibilityLabel={strings.signalement.titre}
      >
        <Text style={typo.titre}>{strings.signalement.titre}</Text>
        <Text style={[typo.corps, styles.texteSheet]}>{strings.signalement.motifIntro}</Text>
        <Cta
          libelle={strings.signalement.confirmer}
          onPress={() => {
            setSheetOuverte(false);
            afficherToast(strings.signalement.confirmation);
          }}
        />
        <View style={styles.espaceur} />
        <Cta
          libelle={strings.signalement.annuler}
          variante="secondaire"
          onPress={() => setSheetOuverte(false)}
        />
      </Sheet>
    </ScrollView>
  );
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.titreSection}>{titre}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  contenu: {
    padding: espaces.l,
    gap: espaces.xl,
    paddingBottom: espaces.xl * 2,
  },
  section: {
    gap: espaces.m,
  },
  titreSection: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  rangeePuces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaces.s,
  },
  espaceur: {
    height: espaces.s,
  },
  espaceurCarte: {
    marginBottom: espaces.m,
  },
  texteSheet: {
    marginTop: espaces.s,
    marginBottom: espaces.l,
  },
});
