import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

import { appellerModele } from '../_shared/anthropic.ts';
import { enTetesCors } from '../_shared/cors.ts';
import { sujetRefuseParModeration } from '../_shared/moderation.ts';

const URL_SUPABASE = Deno.env.get('SUPABASE_URL');
const CLE_ANON = Deno.env.get('SUPABASE_ANON_KEY');
const CLE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!URL_SUPABASE || !CLE_ANON || !CLE_SERVICE) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY doivent être définies.'
  );
}

const NOMBRE_ACCROCHES = 20;
const LIMITE_APPELS_PAR_HEURE = 10;
const MAX_TOKENS_GENERATION = 1500;

type CorpsRequete = {
  sujet?: unknown;
  plateforme?: unknown;
  ton?: unknown;
};

function reponseJson(statut: number, corps: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...enTetesCors, 'content-type': 'application/json' },
  });
}

function construirePrompt(parametres: {
  sujet: string;
  niche: string;
  plateforme: string;
  ton: string;
}): string {
  return `Tu écris des accroches de vidéos courtes en français, prêtes à dire face caméra.

Sujet : ${parametres.sujet}
Niche du créateur : ${parametres.niche}
Plateforme : ${parametres.plateforme}
Ton : ${parametres.ton}

Règles :
- 20 accroches, chacune entre 8 et 15 mots
- formulation orale et naturelle, à la deuxième personne quand c'est possible
- une seule idée par accroche, aucune ne doit se répéter
- pas d'emoji, pas de hashtag, pas de guillemets, pas de numérotation

Réponds uniquement avec un tableau JSON de 20 chaînes de caractères,
sans aucun texte autour et sans balises Markdown.`;
}

function extraireJson(texte: string): unknown {
  const nettoye = texte
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(nettoye);
  } catch {
    return null;
  }
}

function validerAccroches(valeur: unknown): string[] | null {
  if (!Array.isArray(valeur)) return null;

  const nettoyees = valeur
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());

  const dedupliquees = Array.from(new Set(nettoyees));
  if (dedupliquees.length !== NOMBRE_ACCROCHES) return null;

  return dedupliquees;
}

async function genererAccroches(prompt: string): Promise<string[] | null> {
  const texte = await appellerModele(prompt, MAX_TOKENS_GENERATION);
  return validerAccroches(extraireJson(texte));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: enTetesCors });
  }

  if (req.method !== 'POST') {
    return reponseJson(405, { erreur: 'Méthode non autorisée.' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return reponseJson(401, { erreur: 'Authentification requise.' });
    }

    const clientUtilisateur = createClient(URL_SUPABASE as string, CLE_ANON as string, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: erreurUtilisateur,
    } = await clientUtilisateur.auth.getUser();

    if (erreurUtilisateur || !user) {
      return reponseJson(401, { erreur: 'Session invalide.' });
    }

    const corps = (await req.json().catch(() => null)) as CorpsRequete | null;
    const sujet = typeof corps?.sujet === 'string' ? corps.sujet.trim() : '';
    const plateforme = typeof corps?.plateforme === 'string' ? corps.plateforme.trim() : '';
    const ton = typeof corps?.ton === 'string' ? corps.ton.trim() : '';

    if (!sujet || !plateforme || !ton) {
      return reponseJson(400, { erreur: 'Sujet, plateforme et ton sont requis.' });
    }

    const clientService = createClient(URL_SUPABASE as string, CLE_SERVICE as string);

    const { data: profil, error: erreurProfil } = await clientService
      .from('profiles')
      .select('niche, generations_restantes, abonnement_actif')
      .eq('id', user.id)
      .single();

    if (erreurProfil || !profil) {
      return reponseJson(404, { erreur: 'Profil introuvable.' });
    }

    if (!profil.abonnement_actif && profil.generations_restantes <= 0) {
      return reponseJson(402, {
        erreur: 'Tes 3 générations offertes sont épuisées. Abonne-toi pour continuer.',
      });
    }

    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: appelsRecents } = await clientService
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', uneHeureAvant);

    if ((appelsRecents ?? 0) >= LIMITE_APPELS_PAR_HEURE) {
      return reponseJson(429, {
        erreur: 'Trop de générations cette heure-ci. Réessaie un peu plus tard.',
      });
    }

    if (await sujetRefuseParModeration(sujet)) {
      return reponseJson(422, { erreur: 'Ce sujet ne peut pas être traité.' });
    }

    const niche = profil.niche ?? 'non précisée';
    const prompt = construirePrompt({ sujet, niche, plateforme, ton });

    let accroches = await genererAccroches(prompt);
    if (!accroches) {
      accroches = await genererAccroches(prompt);
    }

    if (!accroches) {
      return reponseJson(502, { erreur: 'La génération a échoué. Réessaie dans un instant.' });
    }

    const { error: erreurInsertion } = await clientService.from('generations').insert({
      user_id: user.id,
      sujet,
      plateforme,
      ton,
      hooks: accroches,
    });

    if (erreurInsertion) {
      return reponseJson(500, { erreur: 'Impossible d’enregistrer la génération.' });
    }

    if (!profil.abonnement_actif) {
      const { error: erreurDecrement } = await clientService
        .from('profiles')
        .update({ generations_restantes: profil.generations_restantes - 1 })
        .eq('id', user.id);

      if (erreurDecrement) {
        // La génération a déjà été livrée et enregistrée : on ne fait pas
        // échouer la réponse pour un raté du décrément, mais on le trace.
        console.error('Décrément du quota échoué :', erreurDecrement);
      }
    }

    return reponseJson(200, { hooks: accroches });
  } catch (erreur) {
    console.error(erreur);
    return reponseJson(500, { erreur: 'Erreur inattendue.' });
  }
});
