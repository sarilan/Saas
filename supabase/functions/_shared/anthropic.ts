// Appel minimal à l'API Anthropic (Messages API) depuis l'Edge Function.
// La clé ne vit que côté serveur (secret de fonction), jamais dans le
// bundle client — voir la règle absolue du brief, section 1.

const URL_API = 'https://api.anthropic.com/v1/messages';
const VERSION_API = '2023-06-01';
const MODELE = 'claude-sonnet-5';

const CLE_API = Deno.env.get('ANTHROPIC_API_KEY');

if (!CLE_API) {
  throw new Error('ANTHROPIC_API_KEY est manquante dans les secrets de la fonction.');
}

export async function appellerModele(prompt: string, maxTokens: number): Promise<string> {
  const reponse = await fetch(URL_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': CLE_API as string,
      'anthropic-version': VERSION_API,
    },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!reponse.ok) {
    const texteErreur = await reponse.text().catch(() => '');
    throw new Error(`Appel au modèle échoué (${reponse.status}) : ${texteErreur}`);
  }

  const donnees = (await reponse.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const bloc = donnees.content?.find((item) => item.type === 'text');
  if (!bloc?.text) {
    throw new Error('Réponse du modèle sans contenu texte.');
  }

  return bloc.text;
}
