import { useQuery } from '@tanstack/react-query';

import type { Generation } from '../lib/supabase/types';
import { supabase } from '../lib/supabase/client';
import { useSessionStore } from '../store/session';

const LIMITE_HISTORIQUE = 20;

async function recupererHistorique(userId: string): Promise<Generation[]> {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(LIMITE_HISTORIQUE);

  if (error) throw error;
  return data;
}

export function useHistorique() {
  const userId = useSessionStore((etat) => etat.session?.user.id);

  return useQuery({
    queryKey: ['historique', userId],
    queryFn: () => recupererHistorique(userId as string),
    enabled: Boolean(userId),
  });
}
