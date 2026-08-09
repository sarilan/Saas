import { FunctionsHttpError } from '@supabase/supabase-js';

import { strings } from '../i18n';
import { supabase } from './client';

type ReponseErreur = { erreur: string };

export async function supprimerCompte(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account');

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corps = (await error.context.json().catch(() => null)) as ReponseErreur | null;
      if (corps?.erreur) throw new Error(corps.erreur);
    }
    throw new Error(strings.compte.suppressionErreur);
  }
}
