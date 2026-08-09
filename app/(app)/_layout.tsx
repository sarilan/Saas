import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { strings } from '../../lib/i18n';
import { couleurs, polices } from '../../theme/tokens';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.violet,
        tabBarInactiveTintColor: couleurs.gris,
        tabBarStyle: styles.barre,
        tabBarLabelStyle: styles.libelle,
      }}
    >
      <Tabs.Screen name="creer" options={{ title: strings.onglets.creer }} />
      <Tabs.Screen name="favoris" options={{ title: strings.onglets.favoris }} />
      <Tabs.Screen name="historique" options={{ title: strings.onglets.historique }} />
      <Tabs.Screen name="compte" options={{ title: strings.onglets.compte }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barre: {
    backgroundColor: couleurs.scene,
    borderTopColor: couleurs.ligne,
  },
  libelle: {
    fontFamily: polices.medium,
    fontSize: 11,
  },
});
