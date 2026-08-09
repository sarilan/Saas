import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profil } from '../lib/supabase/types';
import { supabase } from '../lib/supabase/client';
import { useSessionStore } from '../store/session';

async function recupererProfil(userId: string): Promise<Profil> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export function cleProfil(userId: string | undefined) {
  return ['profil', userId] as const;
}

export function useProfil() {
  const userId = useSessionStore((etat) => etat.session?.user.id);

  return useQuery({
    queryKey: cleProfil(userId),
    queryFn: () => recupererProfil(userId as string),
    enabled: Boolean(userId),
  });
}

export function useInvalidationProfil() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((etat) => etat.session?.user.id);

  return () => queryClient.invalidateQueries({ queryKey: cleProfil(userId) });
}
