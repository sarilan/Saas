import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Alerte } from '../components/Alerte';
import { Cta } from '../components/Cta';
import { useToast } from '../components/Toast';
import { cleProfil } from '../hooks/useProfil';
import { strings } from '../lib/i18n';
import {
  acheterForfait,
  formaterPeriode,
  purchasesEstConfigure,
  recupererOffrePrincipale,
  restaurerAchats,
} from '../lib/purchases';
import { useSessionStore } from '../store/session';
import { couleurs, espaces, rayons, typo } from '../theme/tokens';

export default function Paywall() {
  const session = useSessionStore((etat) => etat.session);
  const queryClient = useQueryClient();
  const { afficherToast } = useToast();

  const [forfaitChoisiManuel, setForfaitChoisiManuel] = useState<PurchasesPackage | null>(null);

  const offreQuery = useQuery({
    queryKey: ['offreRevenueCat'],
    queryFn: recupererOffrePrincipale,
    enabled: purchasesEstConfigure(),
  });

  const forfaits = offreQuery.data?.availablePackages ?? [];
  // Présélectionne l'annuel par défaut, sans effet : une simple dérivation
  // pure à partir des données chargées et du choix explicite éventuel.
  const forfaitParDefaut =
    forfaits.find((forfait) => forfait.packageType === PACKAGE_TYPE.ANNUAL) ?? forfaits[0] ?? null;
  const forfaitSelectionne = forfaitChoisiManuel ?? forfaitParDefaut;

  function rafraichirProfilAvecRetard() {
    // Le webhook RevenueCat met à jour abonnement_actif côté serveur de
    // façon asynchrone : on relance quelques rafraîchissements du profil
    // pour rattraper sa propagation sans bloquer l'utilisateur.
    const cle = cleProfil(session?.user.id);
    queryClient.invalidateQueries({ queryKey: cle });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: cle }), 2000);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: cle }), 5000);
  }

  const achatMutation = useMutation({
    mutationFn: acheterForfait,
    onSuccess: () => {
      afficherToast(strings.paywall.achatReussi);
      rafraichirProfilAvecRetard();
      router.back();
    },
  });

  const restaurationMutation = useMutation({
    mutationFn: restaurerAchats,
    onSuccess: (customerInfo) => {
      const aUnAbonnementActif = Object.keys(customerInfo.entitlements.active).length > 0;
      afficherToast(
        aUnAbonnementActif ? strings.paywall.restaurationReussie : strings.paywall.restaurationVide
      );
      rafraichirProfilAvecRetard();
    },
  });

  const erreurAchat =
    achatMutation.error && !(achatMutation.error as { userCancelled?: boolean }).userCancelled
      ? strings.paywall.erreurAchat
      : null;

  const forfaitAnnuel = forfaits.find((forfait) => forfait.packageType === PACKAGE_TYPE.ANNUAL);
  const forfaitMensuel = forfaits.find((forfait) => forfait.packageType === PACKAGE_TYPE.MONTHLY);
  const pourcentageEconomie =
    forfaitAnnuel?.product.pricePerMonth && forfaitMensuel?.product.price
      ? Math.round((1 - forfaitAnnuel.product.pricePerMonth / forfaitMensuel.product.price) * 100)
      : null;

  return (
    <SafeAreaView style={styles.conteneur} edges={['top', 'bottom']}>
      <View style={styles.entete}>
        <Text style={typo.grandTitre}>{strings.paywall.titre}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={strings.paywall.fermer}
          style={styles.boutonFermer}
        >
          <Text style={styles.texteFermer}>{strings.paywall.fermer}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={[typo.corps, styles.sousTitre]}>{strings.paywall.sousTitre}</Text>

        {offreQuery.isLoading ? (
          <Text style={typo.corps}>{strings.commun.chargement}</Text>
        ) : forfaits.length === 0 ? (
          <Alerte message={strings.paywall.erreurChargement} />
        ) : (
          <View style={styles.forfaits}>
            {forfaits.map((forfait) => {
              const selectionne = forfaitSelectionne?.identifier === forfait.identifier;
              const estAnnuel = forfait.packageType === PACKAGE_TYPE.ANNUAL;

              return (
                <Pressable
                  key={forfait.identifier}
                  onPress={() => setForfaitChoisiManuel(forfait)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectionne }}
                  accessibilityLabel={`${forfait.product.title}, ${forfait.product.priceString} ${formaterPeriode(forfait.product.subscriptionPeriod)}`}
                  style={[styles.carteForfait, selectionne && styles.carteForfaitSelectionnee]}
                >
                  <View style={styles.carteForfaitEntete}>
                    <Text style={styles.nomForfait}>{forfait.product.title}</Text>
                    {estAnnuel && pourcentageEconomie && pourcentageEconomie > 0 ? (
                      <View style={styles.badgeEconomie}>
                        <Text style={styles.texteBadgeEconomie}>
                          {strings.paywall.economiePourcentage(pourcentageEconomie)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.prixForfait}>
                    {forfait.product.priceString} {formaterPeriode(forfait.product.subscriptionPeriod)}
                  </Text>
                  {estAnnuel && forfait.product.pricePerMonthString ? (
                    <Text style={styles.equivalentMensuel}>
                      {strings.paywall.equivalentParMois(forfait.product.pricePerMonthString)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {erreurAchat ? <Alerte message={erreurAchat} /> : null}

        <Cta
          libelle={strings.paywall.sAbonner}
          onPress={() => forfaitSelectionne && achatMutation.mutate(forfaitSelectionne)}
          chargement={achatMutation.isPending}
          desactive={!forfaitSelectionne}
        />

        <Cta
          libelle={strings.paywall.restaurer}
          variante="secondaire"
          onPress={() => restaurationMutation.mutate()}
          chargement={restaurationMutation.isPending}
        />

        <Text style={styles.mentionRenouvellement}>{strings.paywall.renouvellementMention}</Text>

        <Text style={styles.mentions}>
          {strings.paywall.mentionLegale}{' '}
          <Link href="/mentions-legales" style={styles.lien}>
            {strings.paywall.lienCgu}
          </Link>{' '}
          {strings.paywall.liaison}{' '}
          <Link href="/confidentialite" style={styles.lien}>
            {strings.paywall.lienConfidentialite}
          </Link>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: espaces.l,
  },
  boutonFermer: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  texteFermer: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 14,
    color: couleurs.gris,
  },
  contenu: {
    padding: espaces.l,
    paddingTop: 0,
    gap: espaces.l,
    paddingBottom: espaces.xl * 2,
  },
  sousTitre: {
    color: couleurs.gris,
  },
  forfaits: {
    gap: espaces.m,
  },
  carteForfait: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: rayons.champ,
    padding: espaces.l,
    gap: espaces.xs,
    backgroundColor: couleurs.scene,
  },
  carteForfaitSelectionnee: {
    borderColor: couleurs.violet,
  },
  carteForfaitEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nomForfait: {
    fontFamily: typo.titre.fontFamily,
    fontSize: 16,
    color: couleurs.craie,
  },
  badgeEconomie: {
    backgroundColor: couleurs.violet,
    borderRadius: rayons.puce,
    paddingHorizontal: espaces.s,
    paddingVertical: 2,
  },
  texteBadgeEconomie: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: 10,
    // Sur fond violet, nuit est le seul texte qui reste conforme au
    // contraste minimum 4,5:1 (voir Chip.tsx et Cta.tsx pour le même choix).
    color: couleurs.nuit,
  },
  prixForfait: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 15,
    color: couleurs.craie,
  },
  equivalentMensuel: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  mentionRenouvellement: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 12,
    color: couleurs.gris,
    lineHeight: 18,
  },
  mentions: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 12,
    color: couleurs.gris,
    textAlign: 'center',
    lineHeight: 18,
  },
  lien: {
    color: couleurs.craie,
    textDecorationLine: 'underline',
  },
});
