import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Alerte } from '../../components/Alerte';
import { Cta } from '../../components/Cta';
import { useToast } from '../../components/Toast';
import { strings } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { couleurs, espaces, rayons, typo } from '../../theme/tokens';

const DUREE_COMPTE_A_REBOURS = 60;

export default function Code() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { afficherToast } = useToast();
  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [secondesRestantes, setSecondesRestantes] = useState(DUREE_COMPTE_A_REBOURS);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const minuteur = setTimeout(() => setSecondesRestantes((valeur) => valeur - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [secondesRestantes]);

  async function verifierCode() {
    if (code.length !== 6 || !email) return;

    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setChargement(false);

    if (error) {
      setErreur(strings.code.codeInvalide);
      return;
    }
    // Succès : la garde de session du layout racine redirige automatiquement
    // dès que la nouvelle session est détectée.
  }

  async function renvoyerCode() {
    if (secondesRestantes > 0 || !email) return;
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setSecondesRestantes(DUREE_COMPTE_A_REBOURS);
    afficherToast(strings.code.codeRenvoye);
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={typo.grandTitre}>{strings.code.titre}</Text>
        <Text style={[typo.corps, styles.sousTitre]}>
          {strings.code.sousTitre(email ?? '')}
        </Text>
      </View>

      <View style={styles.formulaire}>
        <TextInput
          value={code}
          onChangeText={(valeur) => {
            setCode(valeur.replace(/[^0-9]/g, '').slice(0, 6));
            if (erreur) setErreur(null);
          }}
          placeholder="000000"
          placeholderTextColor={couleurs.gris}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
          style={styles.champ}
          accessibilityLabel={strings.code.champCode}
        />

        {erreur ? <Alerte message={erreur} /> : null}

        <Cta
          libelle={strings.code.valider}
          onPress={verifierCode}
          chargement={chargement}
          desactive={code.length !== 6}
        />

        <Pressable
          onPress={renvoyerCode}
          disabled={secondesRestantes > 0}
          accessibilityRole="button"
          style={styles.boutonTexte}
        >
          <Text style={[styles.texteLien, secondesRestantes > 0 && styles.texteLienDesactive]}>
            {secondesRestantes > 0
              ? strings.code.renvoyerDansSecondes(secondesRestantes)
              : strings.code.renvoyerCode}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.boutonTexte}
        >
          <Text style={styles.texteLien}>{strings.code.modifierEmail}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
    padding: espaces.l,
    paddingTop: espaces.xl * 2,
    gap: espaces.xl,
  },
  entete: {
    gap: espaces.s,
  },
  sousTitre: {
    color: couleurs.gris,
  },
  formulaire: {
    gap: espaces.m,
  },
  champ: {
    minHeight: 44,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.scene,
    color: couleurs.craie,
    paddingHorizontal: espaces.m,
    fontFamily: typo.microLibelle.fontFamily,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
  },
  boutonTexte: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteLien: {
    fontFamily: typo.corps.fontFamily,
    fontSize: 14,
    color: couleurs.craie,
    textDecorationLine: 'underline',
  },
  texteLienDesactive: {
    color: couleurs.gris,
    textDecorationLine: 'none',
  },
});
