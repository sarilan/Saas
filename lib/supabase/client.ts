import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';
import { stockageSecurise } from './storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont manquantes. ' +
      'Copie .env.example vers .env et renseigne les valeurs de ton projet Supabase.'
  );
}

// La clé anon est publique par conception (Supabase) : la sécurité vient de
// la RLS côté base, pas du secret de cette clé. Elle n'a rien à voir avec la
// clé du fournisseur de modèle, qui elle ne vit que côté Edge Function.
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: stockageSecurise,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
