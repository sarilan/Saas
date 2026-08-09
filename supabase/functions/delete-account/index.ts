import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// Guideline 5.1.1(v) : la suppression doit effacer les données côté serveur,
// pas seulement la session locale. `profiles`, `generations` et `favoris`
// disparaissent par cascade quand l'utilisateur auth est supprimé (foreign
// keys `on delete cascade`, voir supabase/migrations). `signalements` n'a
// volontairement pas de cascade (décision de l'étape 3, pour que les
// signalements de modération puissent survivre à un compte) : on les
// efface donc explicitement ici, par cohérence avec l'exigence de
// suppression complète des données personnelles.

const URL_SUPABASE = Deno.env.get('SUPABASE_URL');
const CLE_ANON = Deno.env.get('SUPABASE_ANON_KEY');
const CLE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!URL_SUPABASE || !CLE_ANON || !CLE_SERVICE) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY doivent être définies.'
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erreur: 'Méthode non autorisée.' }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ erreur: 'Authentification requise.' }), {
        status: 401,
      });
    }

    const clientUtilisateur = createClient(URL_SUPABASE as string, CLE_ANON as string, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: erreurUtilisateur,
    } = await clientUtilisateur.auth.getUser();

    if (erreurUtilisateur || !user) {
      return new Response(JSON.stringify({ erreur: 'Session invalide.' }), { status: 401 });
    }

    const clientService = createClient(URL_SUPABASE as string, CLE_SERVICE as string);

    const { error: erreurSignalements } = await clientService
      .from('signalements')
      .delete()
      .eq('user_id', user.id);

    if (erreurSignalements) {
      console.error('Suppression des signalements échouée :', erreurSignalements);
    }

    const { error: erreurSuppression } = await clientService.auth.admin.deleteUser(user.id);

    if (erreurSuppression) {
      console.error('Suppression du compte échouée :', erreurSuppression);
      return new Response(JSON.stringify({ erreur: 'Suppression du compte échouée.' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (erreur) {
    console.error(erreur);
    return new Response(JSON.stringify({ erreur: 'Erreur inattendue.' }), { status: 500 });
  }
});
