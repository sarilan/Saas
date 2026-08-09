-- Schéma initial HookGen : profils, générations, favoris, signalements.
-- RLS activée sur les quatre tables : chaque utilisateur ne lit et n'écrit
-- que ses propres lignes (brief section 2).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  niche text,
  plateforme text,
  ton text,
  onboarded boolean not null default false,
  generations_restantes integer not null default 3,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_lecture_personnelle"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_ecriture_personnelle"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Le client ne peut modifier que ses préférences, jamais son quota :
-- seule l'Edge Function `generate`, via la clé de service, décrémente
-- generations_restantes (voir aussi le déclencheur de protection ci-dessous).
revoke update on public.profiles from authenticated;
grant update (niche, plateforme, ton, onboarded) on public.profiles to authenticated;

-- Un utilisateur créé dans auth.users obtient automatiquement sa ligne de
-- profil, avec les 3 générations offertes (jamais un essai gratuit, voir
-- brief section 5, point 10).
create function public.gerer_nouvel_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();

-- Filet de sécurité supplémentaire : même si un rôle obtenait un accès en
-- écriture plus large que prévu, generations_restantes ne peut être modifié
-- que par le rôle service_role (utilisé côté serveur par l'Edge Function).
create function public.proteger_generations_restantes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role'
     and new.generations_restantes is distinct from old.generations_restantes then
    new.generations_restantes := old.generations_restantes;
  end if;
  return new;
end;
$$;

create trigger profiles_proteger_quota
  before update on public.profiles
  for each row execute function public.proteger_generations_restantes();

-- ---------------------------------------------------------------------------
-- generations
-- ---------------------------------------------------------------------------

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sujet text not null,
  plateforme text not null,
  ton text not null,
  hooks jsonb not null,
  created_at timestamptz not null default now()
);

create index generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

create policy "generations_lecture_personnelle"
  on public.generations for select
  to authenticated
  using (auth.uid() = user_id);

-- Aucune policy insert/update/delete pour authenticated : seule l'Edge
-- Function `generate`, via la clé de service (qui contourne RLS), écrit
-- dans cette table. Le client ne peut jamais s'auto-attribuer des
-- générations ni falsifier son historique.

-- ---------------------------------------------------------------------------
-- favoris
-- ---------------------------------------------------------------------------

create table public.favoris (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  texte text not null,
  created_at timestamptz not null default now(),
  unique (user_id, texte)
);

create index favoris_user_id_created_at_idx
  on public.favoris (user_id, created_at desc);

alter table public.favoris enable row level security;

create policy "favoris_lecture_personnelle"
  on public.favoris for select
  to authenticated
  using (auth.uid() = user_id);

create policy "favoris_ecriture_personnelle"
  on public.favoris for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favoris_suppression_personnelle"
  on public.favoris for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- signalements
-- ---------------------------------------------------------------------------

-- user_id n'est volontairement pas une clé étrangère vers profiles : c'est
-- la lecture littérale du schéma du brief (les trois autres tables
-- spécifient "ref ... on delete cascade", pas celle-ci). Un signalement de
-- modération doit pouvoir survivre à la suppression du compte de son
-- auteur ; l'Edge Function de suppression de compte (étape 10) anonymise
-- ces lignes explicitement plutôt que de compter sur une cascade.
create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  texte text not null,
  motif text,
  created_at timestamptz not null default now()
);

create index signalements_user_id_idx on public.signalements (user_id);

alter table public.signalements enable row level security;

create policy "signalements_lecture_personnelle"
  on public.signalements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "signalements_ecriture_personnelle"
  on public.signalements for insert
  to authenticated
  with check (auth.uid() = user_id);
