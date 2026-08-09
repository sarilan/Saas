import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '../components/Toast';
import { useProfil } from '../hooks/useProfil';
import { useEcouteSession } from '../lib/navigation/useEcouteSession';
import { usePurchasesSync } from '../lib/navigation/usePurchasesSync';
import { queryClient } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import { couleurs } from '../theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: couleurs.nuit }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <ToastProvider>
            <NavigationProtegee />
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function NavigationProtegee() {
  useEcouteSession();
  usePurchasesSync();

  const session = useSessionStore((etat) => etat.session);
  const pretAuthentification = useSessionStore((etat) => etat.pretAuthentification);
  const { data: profil, isLoading: profilEnChargement } = useProfil();

  const pret = pretAuthentification && (!session || !profilEnChargement);

  if (!pret) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator color={couleurs.violet} />
      </View>
    );
  }

  const estOnboarde = Boolean(profil?.onboarded);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: couleurs.nuit },
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !estOnboarde}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && estOnboarde}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="demo" />
      <Stack.Screen name="mentions-legales" />
      <Stack.Screen name="confidentialite" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.nuit,
  },
});
