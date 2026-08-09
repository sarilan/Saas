import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// Tenu à jour `profiles.abonnement_actif` en réaction aux événements
// d'abonnement RevenueCat. Plutôt que d'interpréter le champ `event.type`
// (fragile : de nombreux types différents accordent ou retirent l'accès),
// on relit l'état d'abonné faisant autorité via l'API REST RevenueCat à
// chaque appel — approche recommandée par RevenueCat elle-même.

const URL_SUPABASE = Deno.env.get('SUPABASE_URL');
const CLE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SECRET_WEBHOOK = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
const CLE_API_REVENUECAT = Deno.env.get('REVENUECAT_SECRET_API_KEY');

if (!URL_SUPABASE || !CLE_SERVICE || !SECRET_WEBHOOK || !CLE_API_REVENUECAT) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVENUECAT_WEBHOOK_SECRET et ' +
      'REVENUECAT_SECRET_API_KEY doivent être définies.'
  );
}

// Doit correspondre à IDENTIFIANT_ENTITLEMENT_PRO dans lib/purchases.ts.
const IDENTIFIANT_ENTITLEMENT_PRO = 'pro';

type EvenementRevenueCat = {
  event?: {
    app_user_id?: string;
    type?: string;
  };
};

async function abonnementProActif(appUserId: string): Promise<boolean> {
  const reponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${CLE_API_REVENUECAT}` } }
  );

  if (!reponse.ok) {
    throw new Error(`Lecture de l'abonné RevenueCat échouée (${reponse.status}).`);
  }

  const donnees = (await reponse.json()) as {
    subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
  };

  const entitlement = donnees.subscriber?.entitlements?.[IDENTIFIANT_ENTITLEMENT_PRO];
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erreur: 'Méthode non autorisée.' }), { status: 405 });
  }

  if (req.headers.get('Authorization') !== `Bearer ${SECRET_WEBHOOK}`) {
    return new Response(JSON.stringify({ erreur: 'Non autorisé.' }), { status: 401 });
  }

  try {
    const corps = (await req.json().catch(() => null)) as EvenementRevenueCat | null;
    const appUserId = corps?.event?.app_user_id;

    if (!appUserId) {
      return new Response(JSON.stringify({ erreur: 'app_user_id manquant.' }), { status: 400 });
    }

    const actif = await abonnementProActif(appUserId);

    const clientService = createClient(URL_SUPABASE as string, CLE_SERVICE as string);
    const { error } = await clientService
      .from('profiles')
      .update({ abonnement_actif: actif })
      .eq('id', appUserId);

    if (error) {
      console.error('Mise à jour du profil échouée :', error);
      return new Response(JSON.stringify({ erreur: 'Mise à jour du profil échouée.' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (erreur) {
    console.error(erreur);
    return new Response(JSON.stringify({ erreur: 'Erreur inattendue.' }), { status: 500 });
  }
});
