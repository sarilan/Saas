-- L'Edge Function `generate` doit savoir si l'appelant est abonné pour
-- décider d'appliquer le quota des 3 générations offertes ou non (brief
-- section 2, logique de l'Edge Function, point 2). Cette colonne ne fait
-- pas partie du schéma à quatre tables du brief mais en découle
-- directement : sans elle, impossible de distinguer un abonné actif d'un
-- utilisateur non abonné côté serveur. Tenue à jour par le webhook
-- RevenueCat (étape 9) ; par défaut personne n'est abonné.

alter table public.profiles
  add column abonnement_actif boolean not null default false;
