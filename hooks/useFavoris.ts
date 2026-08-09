import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Favori } from '../lib/supabase/types';
import { supabase } from '../lib/supabase/client';
import { useSessionStore } from '../store/session';

async function recupererFavoris(userId: string): Promise<Favori[]> {
  const { data, error } = await supabase
    .from('favoris')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export function cleFavoris(userId: string | undefined) {
  return ['favoris', userId] as const;
}

export function useFavoris() {
  const userId = useSessionStore((etat) => etat.session?.user.id);

  return useQuery({
    queryKey: cleFavoris(userId),
    queryFn: () => recupererFavoris(userId as string),
    enabled: Boolean(userId),
  });
}

type ParametresBasculerFavori = {
  texte: string;
  enFavori: boolean;
};

export function useBasculerFavori() {
  const userId = useSessionStore((etat) => etat.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ texte, enFavori }: ParametresBasculerFavori) => {
      if (!userId) throw new Error('Session requise.');

      if (enFavori) {
        const { error } = await supabase
          .from('favoris')
          .delete()
          .eq('user_id', userId)
          .eq('texte', texte);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('favoris').insert({ user_id: userId, texte });
      // 23505 = violation de la contrainte unique (user_id, texte) : l'accroche
      // est déjà en favoris (tap en double avant que le cache ne se rafraîchisse),
      // rien à signaler à l'utilisateur.
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cleFavoris(userId) });
    },
  });
}
