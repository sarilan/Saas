import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { Cta } from '../../components/Cta';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { useInvalidationProfil, useProfil } from '../../hooks/useProfil';
import { strings } from '../../lib/i18n';
import { restaurerAchats } from '../../lib/purchases';
import { supabase } from '../../lib/supabase/client';
import { supprimerCompte } from '../../lib/supabase/compte';
import type { ProfilUpdate } from '../../lib/supabase/types';
import { useOnboardingStore } from '../../store/onboarding';
import { useSessionStore } from '../../store/session';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

const URL_GESTION_ABONNEMENT_APPLE = 'itms-apps://apps.apple.com/account/subscriptions';
const URL_CONTACT = `mailto:${strings.contact.email}`;

type ChampPreference = 'niche' | 'plateforme' | 'ton';

export default function Compte() {
  const session = useSessionStore((etat) => etat.session);
  const { data: profil } = useProfil();
  const invaliderProfil = useInvalidationProfil();
  const { afficherToast } = useToast();

  const [champEnEdition, setChampEnEdition] = useState<ChampPreference | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  const restaurationMutation = useMutation({
    mutationFn: restaurerAchats,
    onSuccess: async (customerInfo) => {
      const aUnAbonnementActif = Object.keys(customerInfo.entitlements.active).length > 0;
      afficherToast(
        aUnAbonnementActif ? strings.paywall.restaurationReussie : strings.paywall.restaurationVide
      );
      await invaliderProfil();
    },
  });

  const preferenceMutation = useMutation({
    mutationFn: async ({ champ, valeur }: { champ: ChampPreference; valeur: string }) => {
      if (!session) throw new Error('Session requise.');
      const { error } = await supabase
        .from('profiles')
        .update({ [champ]: valeur } as Pick<ProfilUpdate, ChampPreference>)
        .eq('id', session.user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setChampEnEdition(null);
      await invaliderProfil();
      afficherToast(strings.compte.preferenceMiseAJour);
    },
  });

  const suppressionMutation = useMutation({
    mutationFn: supprimerCompte,
    onSuccess: async () => {
      setSuppressionOuverte(false);
      await supabase.auth.signOut();
      useOnboardingStore.getState().reinitialiser();
    },
  });

  async function seDeconnecter() {
    await supabase.auth.signOut();
    useOnboardingStore.getState().reinitialiser();
  }

  const optionsParChamp: Record<ChampPreference, readonly string[]> = {
    niche: strings.onboarding.niches,
    plateforme: strings.onboarding.plateformes,
    ton: strings.onboarding.tons,
  };

  const titreParChamp: Record<ChampPreference, string> = {
    niche: strings.compte.choisirNiche,
    plateforme: strings.compte.choisirPlateforme,
    ton: strings.compte.choisirTon,
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={typo.grandTitre}>{strings.compte.titre}</Text>

      <View style={styles.section}>
        <LigneInfo libelle={strings.compte.emailLabel} valeur={session?.user.email ?? ''} />
        <LigneInfo
          libelle={strings.compte.generationsRestantesLabel}
          valeur={
            profil?.abonnement_actif
              ? strings.compte.illimite
              : String(profil?.generations_restantes ?? 0)
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>{strings.compte.preferencesTitre}</Text>
        <LigneModifiable
          libelle={strings.compte.nicheLabel}
          valeur={profil?.niche ?? '—'}
          onModifier={() => setChampEnEdition('niche')}
        />
        <LigneModifiable
          libelle={strings.compte.plateformeLabel}
          valeur={profil?.plateforme ?? '—'}
          onModifier={() => setChampEnEdition('plateforme')}
        />
        <LigneModifiable
          libelle={strings.compte.tonLabel}
          valeur={profil?.ton ?? '—'}
          onModifier={() => setChampEnEdition('ton')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>{strings.compteAbonnement.titre}</Text>
        <Text style={typo.corps}>
          {profil?.abonnement_actif
            ? strings.compteAbonnement.statutPro
            : strings.compteAbonnement.statutGratuit}
        </Text>

        {profil?.abonnement_actif ? (
          <Cta
            libelle={strings.compteAbonnement.gerer}
            variante="secondaire"
            onPress={() => Linking.openURL(URL_GESTION_ABONNEMENT_APPLE)}
          />
        ) : (
          <Cta
            libelle={strings.compteAbonnement.sAbonner}
            onPress={() => router.push('/paywall')}
          />
        )}

        <Cta
          libelle={strings.compteAbonnement.restaurer}
          variante="secondaire"
          onPress={() => restaurationMutation.mutate()}
          chargement={restaurationMutation.isPending}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>{strings.compte.assistanceTitre}</Text>
        <Pressable
          onPress={() => Linking.openURL(URL_CONTACT)}
          accessibilityRole="link"
          style={styles.ligneLien}
        >
          <Text style={styles.texteLien}>{strings.compte.nousContacter}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/mentions-legales')}
          accessibilityRole="link"
          style={styles.ligneLien}
        >
          <Text style={styles.texteLien}>{strings.compte.lienCgu}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/confidentialite')}
          accessibilityRole="link"
          style={styles.ligneLien}
        >
          <Text style={styles.texteLien}>{strings.compte.lienConfidentialite}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Cta libelle={strings.compte.deconnexion} variante="secondaire" onPress={seDeconnecter} />
      </View>

      <View style={[styles.section, styles.sectionDanger]}>
        <Text style={styles.titreSection}>{strings.compte.zoneDangereuseTitre}</Text>
        <Pressable
          onPress={() => setSuppressionOuverte(true)}
          accessibilityRole="button"
          style={styles.boutonSuppression}
        >
          <Text style={styles.texteSuppression}>{strings.compte.supprimerCompte}</Text>
        </Pressable>
      </View>

      <Sheet
        visible={champEnEdition !== null}
        onClose={() => setChampEnEdition(null)}
        accessibilityLabel={champEnEdition ? titreParChamp[champEnEdition] : undefined}
      >
        {champEnEdition ? (
          <>
            <Text style={typo.titre}>{titreParChamp[champEnEdition]}</Text>
            <View style={styles.optionsEdition}>
              {optionsParChamp[champEnEdition].map((option) => (
                <Chip
                  key={option}
                  libelle={option}
                  selectionne={profil?.[champEnEdition] === option}
                  onPress={() => preferenceMutation.mutate({ champ: champEnEdition, valeur: option })}
                />
              ))}
            </View>
          </>
        ) : null}
      </Sheet>

      <Sheet
        visible={suppressionOuverte}
        onClose={() => setSuppressionOuverte(false)}
        accessibilityLabel={strings.compte.suppressionTitre}
      >
        <Text style={typo.titre}>{strings.compte.suppressionTitre}</Text>
        <Text style={[typo.corps, styles.texteSheet]}>{strings.compte.suppressionTexte}</Text>
        <Cta
          libelle={strings.compte.suppressionConfirmer}
          onPress={() => suppressionMutation.mutate()}
          chargement={suppressionMutation.isPending}
        />
        <View style={styles.espaceur} />
        <Cta
          libelle={strings.compte.suppressionAnnuler}
          variante="secondaire"
          onPress={() => setSuppressionOuverte(false)}
        />
      </Sheet>
    </ScrollView>
  );
}

function LigneInfo({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.ligneInfo}>
      <Text style={styles.libelleLigne}>{libelle}</Text>
      <Text style={typo.corps}>{valeur}</Text>
    </View>
  );
}

function LigneModifiable({
  libelle,
  valeur,
  onModifier,
}: {
  libelle: string;
  valeur: string;
  onModifier: () => void;
}) {
  return (
    <View style={styles.ligneInfo}>
      <View>
        <Text style={styles.libelleLigne}>{libelle}</Text>
        <Text style={typo.corps}>{valeur}</Text>
      </View>
      <Pressable
        onPress={onModifier}
        accessibilityRole="button"
        accessibilityLabel={`${strings.compte.modifier} ${libelle}`}
        style={styles.boutonModifier}
      >
        <Text style={styles.texteLien}>{strings.compte.modifier}</Text>
      </Pressable>
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
    paddingTop: espaces.xl,
    gap: espaces.l,
    paddingBottom: espaces.xl * 2,
  },
  section: {
    gap: espaces.m,
    backgroundColor: couleurs.scene,
    borderRadius: rayons.champ,
    padding: espaces.l,
  },
  sectionDanger: {
    borderWidth: 1,
    borderColor: couleurs.alerteBord,
  },
  titreSection: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  ligneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  libelleLigne: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
    marginBottom: 2,
  },
  boutonModifier: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ligneLien: {
    minHeight: 44,
    justifyContent: 'center',
  },
  texteLien: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 14,
    color: couleurs.craie,
    textDecorationLine: 'underline',
  },
  boutonSuppression: {
    minHeight: 44,
    justifyContent: 'center',
  },
  texteSuppression: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 15,
    color: couleurs.alerteTexte,
  },
  optionsEdition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaces.s,
    marginTop: espaces.m,
    marginBottom: espaces.l,
  },
  texteSheet: {
    marginTop: espaces.s,
    marginBottom: espaces.l,
  },
  espaceur: {
    height: espaces.s,
  },
});
