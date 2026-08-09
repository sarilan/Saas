import { appellerModele } from './anthropic.ts';

const PROMPT_MAX_TOKENS = 8;

function construirePromptModeration(sujet: string): string {
  return [
    'Réponds uniquement par OUI ou NON, sans aucun autre mot.',
    '',
    'Le sujet suivant a été soumis pour générer des accroches de vidéo courte.',
    'Réponds OUI si ce sujet relève de contenu à caractère sexuel, haineux ou violent,',
    'ou s’il vise nommément une personne réelle dans un but de nuire.',
    'Réponds NON dans tous les autres cas.',
    '',
    `Sujet : "${sujet}"`,
  ].join('\n');
}

// Modération en entrée (brief section 7, point 1). Faute de service de
// modération dédié imposé par le brief, on réutilise le même modèle en
// classification stricte OUI/NON, moins cher et plus rapide qu'une
// génération complète. En cas de réponse ambiguë ou d'échec de l'appel,
// on referme le portail par défaut (fail closed) plutôt que de laisser
// passer un sujet non vérifié.
export async function sujetRefuseParModeration(sujet: string): Promise<boolean> {
  try {
    const reponse = await appellerModele(construirePromptModeration(sujet), PROMPT_MAX_TOKENS);
    const normalisee = reponse.trim().toUpperCase();

    if (normalisee.startsWith('NON')) return false;
    if (normalisee.startsWith('OUI')) return true;

    return true;
  } catch (erreur) {
    console.error('Modération indisponible, sujet refusé par défaut :', erreur);
    return true;
  }
}
