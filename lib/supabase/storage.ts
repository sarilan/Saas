import * as SecureStore from 'expo-secure-store';

// Adaptateur de stockage du jeton de session pour supabase-js, sur
// expo-secure-store (Keychain iOS / Keystore Android) plutôt que sur un
// stockage non chiffré.
export const stockageSecurise = {
  getItem: (cle: string) => SecureStore.getItemAsync(cle),
  setItem: (cle: string, valeur: string) => SecureStore.setItemAsync(cle, valeur),
  removeItem: (cle: string) => SecureStore.deleteItemAsync(cle),
};
