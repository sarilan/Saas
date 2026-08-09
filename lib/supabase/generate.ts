import { FunctionsHttpError } from '@supabase/supabase-js';

import { strings } from '../i18n';
import { supabase } from './client';

export type ParametresGeneration = {
  sujet: string;
  plateforme: string;
  ton: string;
};

type ReponseGenerate = { hooks: string[] };
type ReponseErreur = { erreur: string };

export async function genererAccroches(parametres: ParametresGeneration): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<ReponseGenerate>('generate', {
    body: parametres,
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corps = (await error.context.json().catch(() => null)) as ReponseErreur | null;
      if (corps?.erreur) throw new Error(corps.erreur);
    }
    throw new Error(strings.creer.erreurGenerique);
  }

  if (!data?.hooks) {
    throw new Error(strings.creer.erreurGenerique);
  }

  return data.hooks;
}
