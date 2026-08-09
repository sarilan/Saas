// Unique source de vérité pour toutes les chaînes visibles de l'app.
// Aucun texte affiché à l'utilisateur ne doit être écrit ailleurs qu'ici.

export const fr = {
  commun: {
    nomApp: 'HookGen',
    chargement: 'Chargement…',
  },
  onglets: {
    creer: 'Créer',
    favoris: 'Favoris',
    historique: 'Historique',
    compte: 'Compte',
  },
  hookCard: {
    copie: 'Accroche copiée',
    astuceCopie: 'Touche pour copier, appui long pour signaler.',
    ajouterFavori: 'Ajouter aux favoris',
    retirerFavori: 'Retirer des favoris',
    dureeOrale: 'Durée à l’oral estimée',
  },
  signalement: {
    titre: 'Signaler cette accroche',
    motifIntro: 'Dis-nous ce qui ne va pas, on regarde ça.',
    confirmer: 'Signaler',
    annuler: 'Annuler',
    confirmation: 'Signalement envoyé, merci.',
  },
  demo: {
    titre: 'Bibliothèque de composants',
    sousTitrePuces: 'Chip',
    sousTitreCta: 'Cta',
    sousTitreEtapes: 'Steps',
    sousTitreAccroches: 'HookCard + Meter',
  },
} as const;
