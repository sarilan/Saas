import * as AppleAuthentication from 'expo-apple-authentication';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Alerte } from '../../components/Alerte';
import { Cta } from '../../components/Cta';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Accueil() {
  const [email, setEmail] = useState('');
  const [chargement, setChargement] = useState(false);
  const [appleDisponible, setAppleDisponible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleDisponible);
  }, []);

  async function envoyerCode() {
    const emailNettoye = email.trim();
    if (!REGEX_EMAIL.test(emailNettoye)) {
      setErreur(strings.accueil.emailInvalide);
      return;
    }

    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailNettoye,
      options: { shouldCreateUser: true },
    });
    setChargement(false);

    if (error) {
      setErreur(strings.accueil.erreurEnvoiCode);
      return;
    }

    router.push({ pathname: '/(auth)/code', params: { email: emailNettoye } });
  }

  async function continuerAvecApple() {
    try {
      const identifiants = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });

      if (!identifiants.identityToken) {
        throw new Error('Jeton d’identité Apple manquant.');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identifiants.identityToken,
      });

      if (error) throw error;
      setErreur(null);
    } catch (erreurCapturee) {
      const code = (erreurCapturee as { code?: string } | null)?.code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      setErreur(strings.accueil.erreurApple);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.contenu}>
        <View style={styles.entete}>
          <Text style={typo.grandTitre}>{strings.commun.nomApp}</Text>
          <Text style={[typo.corps, styles.promesse]}>{strings.accueil.promesse}</Text>
        </View>

        <View style={styles.formulaire}>
          <Text style={styles.libelleChamp}>{strings.accueil.champEmail}</Text>
          <TextInput
            value={email}
            onChangeText={(valeur) => {
              setEmail(valeur);
              if (erreur) setErreur(null);
            }}
            placeholder={strings.accueil.exempleEmail}
            placeholderTextColor={couleurs.gris}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.champ}
            accessibilityLabel={strings.accueil.champEmail}
          />

          {erreur ? <Alerte message={erreur} /> : null}

          <Cta
            libelle={strings.accueil.recevoirCode}
            onPress={envoyerCode}
            chargement={chargement}
            desactive={email.trim().length === 0}
          />

          {appleDisponible ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={rayons.champ}
              style={styles.boutonApple}
              onPress={continuerAvecApple}
            />
          ) : null}
        </View>

        <Text style={styles.mentions}>
          {strings.accueil.mentionLegale}{' '}
          <Link href="/mentions-legales" style={styles.lien}>
            {strings.accueil.lienCgu}
          </Link>{' '}
          {strings.accueil.liaison}{' '}
          <Link href="/confidentialite" style={styles.lien}>
            {strings.accueil.lienConfidentialite}
          </Link>
          .
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
  },
  contenu: {
    flex: 1,
    justifyContent: 'space-between',
    padding: espaces.l,
    paddingTop: espaces.xl * 2,
    paddingBottom: espaces.xl,
    gap: espaces.xl,
  },
  entete: {
    gap: espaces.s,
  },
  promesse: {
    color: couleurs.gris,
  },
  formulaire: {
    gap: espaces.m,
  },
  libelleChamp: {
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: typo.microLibelle.fontSize,
    letterSpacing: typo.microLibelle.letterSpacing,
    textTransform: typo.microLibelle.textTransform,
    color: couleurs.gris,
  },
  champ: {
    minHeight: 44,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.scene,
    color: couleurs.craie,
    paddingHorizontal: espaces.m,
    fontFamily: typo.corps.fontFamily,
    fontSize: 16,
  },
  boutonApple: {
    height: 44,
    width: '100%',
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
