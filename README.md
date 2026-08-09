# HookGen

Application iOS d'abonnement : l'utilisateur saisit un sujet, choisit une plateforme et un ton,
et reçoit 20 accroches de vidéo courte prêtes à dire face caméra, chacune avec sa durée estimée
à l'oral comparée à un budget de 3 secondes.

Construit à partir du brief `hookgen-brief-claude-code.md`, réalisé étape par étape (un commit
par étape de la section 8 du brief).

## Stack

- Expo SDK 57, React Native, TypeScript strict, expo-router
- Zustand, TanStack Query
- Supabase (Auth, Postgres, Edge Functions) comme backend et proxy vers le modèle de langage
- RevenueCat (react-native-purchases) pour les achats intégrés

## Démarrer en local

```bash
npm install
cp .env.example .env   # renseigner les valeurs du projet Supabase
npm run ios             # simulateur iOS
npm run typecheck
npm run lint
```

## Backend Supabase

```bash
supabase start                     # instance locale (Docker)
supabase db push                   # applique supabase/migrations
supabase gen types typescript --linked > lib/supabase/types.ts
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy generate
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées
automatiquement par la plateforme dans chaque Edge Function ; seule `ANTHROPIC_API_KEY` doit
être définie manuellement, et uniquement comme secret de fonction — jamais dans le `.env` du
client.

## Hypothèses

Ce projet est réalisé sans aller-retour de clarification, conformément à la section 10 du brief.
Les décisions prises en l'absence de précision explicite sont documentées ici au fil des étapes :

- **Étape 1** : le bundle identifier iOS/Android provisoire est `com.hookgen.app` (à remplacer
  par l'identifiant réel avant soumission App Store). Navigation `(app)` implémentée en barre
  d'onglets (Créer, Favoris, Historique, Compte), cohérent avec les quatre écrans principaux
  listés à la section 4. `userInterfaceStyle` réglé sur `dark` puisque la direction design
  (section 3) est exclusivement sombre — pas de mode clair prévu, et la section 10 exclut
  explicitement un mode sombre "optionnel" (donc le mode sombre est permanent, pas un choix).

- **Étape 2** : `@expo/vector-icons` (Ionicons) est utilisé pour l'étoile de favori et les
  icônes d'interface — c'est un jeu de pictogrammes, pas une bibliothèque de composants imposant
  son propre style, donc compatible avec l'interdiction de la section 10. Le texte du bouton
  primaire (`Cta`) est en `couleurs.nuit` plutôt que `couleurs.craie` : c'est le seul choix qui
  respecte le contraste minimum de 4,5:1 sur fond violet (la section 3 ne précise la couleur de
  texte que pour le bouton secondaire). L'écran de démonstration interne vit à la route
  top-level `/demo`, hors des groupes `(auth)/(onboarding)/(app)` puisqu'il n'appartient à
  aucun flux utilisateur réel ; il sera retiré ou déplacé derrière un accès développeur avant la
  soumission App Store (guideline 2.3.1, section 5, pas de code destiné à un usage caché — ici
  c'est un outil de développement temporaire, pas une fonctionnalité dissimulée).
  `react-native-worklets` et `babel-preset-expo` doivent être ajoutés explicitement en
  dépendance top-level : le gestionnaire npm ne les hissait pas automatiquement dans cet
  environnement, provoquant un échec de bundling silencieux sans cet ajout.

- **Étape 3** : `signalements.user_id` n'est pas déclarée en clé étrangère vers `profiles` — le
  schéma du brief l'écrit sans le `ref ... on delete cascade` présent sur les trois autres
  tables. Un signalement de modération doit pouvoir survivre à la suppression du compte de son
  auteur ; la suppression de compte (étape 10) anonymisera ces lignes explicitement plutôt que
  de compter sur une cascade. La création de la ligne `profiles` à l'inscription passe par un
  déclencheur Postgres sur `auth.users` (`gerer_nouvel_utilisateur`), standard chez Supabase et
  nécessaire pour que l'écran d'onboarding (étape 5) trouve toujours un profil à mettre à jour.
  `generations_restantes` n'est modifiable que par le rôle `service_role` : la policy UPDATE de
  `profiles` est restreinte par colonne (`grant update (niche, plateforme, ton, onboarded)`) et
  doublée d'un déclencheur qui annule toute tentative de modification du quota par un autre
  rôle — défense en profondeur pour le critère d'acceptation « le quota résiste à la triche ».
  `lib/supabase/types.ts` est écrit à la main : en l'absence de projet Supabase distant lié
  pendant la réalisation, la commande `supabase gen types typescript --linked` ne peut pas
  s'exécuter ici. À relancer pour régénérer ce fichier dès qu'un projet réel est lié. Le client
  Supabase (`lib/supabase/client.ts`) lève une erreur explicite si les variables
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont absentes plutôt que
  d'échouer silencieusement plus tard ; voir `.env.example`.

- **Étape 4** : la garde de session (`app/_layout.tsx`) utilise l'API déclarative
  `Stack.Protected` d'expo-router plutôt qu'une redirection impérative — c'est le mécanisme
  recommandé pour ce cas dans les versions récentes du router, et il évite les flashs d'écran
  incorrect le temps qu'un `useEffect` se déclenche. Les routes hors groupe (`/demo`,
  `/mentions-legales`, `/confidentialite`) restent volontairement accessibles quel que soit
  l'état de session : ce sont des pages publiques ou un outil de développement, pas des écrans
  du parcours utilisateur protégé. Sign in with Apple ne demande que le scope `EMAIL` (pas
  `FULL_NAME`) puisque l'app n'affiche le nom de l'utilisateur nulle part — strict nécessaire
  au sens de la guideline 4.8. Les pages `/mentions-legales` et `/confidentialite` contiennent
  un texte juridique générique écrit pour ce projet ; à faire relire par un juriste avant toute
  soumission réelle sur l'App Store. L'adresse de contact provisoire est `support@hookgen.app`.
  Un bouton « Se déconnecter » minimal a été ajouté à l'écran Compte (encore un placeholder par
  ailleurs) pour que le cycle complet connexion/déconnexion soit testable dès cette étape ; le
  reste de l'écran Compte est construit à l'étape 10.

- **Étape 5** : les 10 niches, les tons et le rattachement des plateformes ne sont pas énumérés
  dans le brief — liste choisie pour un public de créateurs francophones (Beauté, Fitness,
  Cuisine, Business & argent, Développement personnel, Tech & gadgets, Mode, Voyage, Gaming,
  Parentalité) ; les tons (Direct, Complice, Provocateur, Inspirant, Humoristique, Sérieux)
  sont ceux qui infléchiront le prompt de génération à l'étape 6. `(onboarding)/[step].tsx` est
  une unique route dynamique comme le prescrit l'architecture (section 2), avec un store
  Zustand (`store/onboarding.ts`) qui accumule les trois choix en mémoire sans toucher la base
  tant que l'étape « ton » n'est pas validée — un seul `update` Postgres à la fin, conforme à
  « écrit le profil en base à la validation, pas à chaque tap ». Le fichier de types Supabase
  généré à la main (étape 3) avait oublié le champ `Relationships` requis par les types
  génériques de postgrest-js : sans lui, toute méthode `.update()`/`.insert()` typée retombe
  silencieusement sur `never`. Corrigé ici — un rappel que la régénération réelle
  (`supabase gen types`) reste nécessaire dès qu'un projet est lié.

- **Étape 6** : le fournisseur de modèle n'est pas nommé dans le brief — l'Edge Function
  `generate` appelle l'API Anthropic (Claude) depuis `supabase/functions/_shared/anthropic.ts`,
  avec la clé en secret de fonction (`ANTHROPIC_API_KEY`), jamais côté client. Pour savoir si
  l'appelant est abonné (condition du point 2 de la logique serveur), une colonne
  `profiles.abonnement_actif` a été ajoutée par une migration dédiée : elle n'est pas dans les
  quatre tables du brief mais en découle directement, et sera tenue à jour par le webhook
  RevenueCat à l'étape 9 — en attendant, elle vaut `false` par défaut, donc tout le monde passe
  par le quota des 3 générations offertes. La modération d'entrée (section 7) n'a pas de service
  dédié imposé par le brief : elle réutilise le même modèle en classification stricte OUI/NON
  (prompt séparé, peu de tokens) et referme le portail par défaut si la réponse est ambiguë ou
  si l'appel échoue (fail closed), plutôt que de laisser passer un sujet non vérifié. La limite
  de débit (10 appels/heure) est calculée en comptant les lignes `generations` déjà insérées
  pour l'utilisateur sur la dernière heure plutôt que via une table de compteurs séparée : ça
  respecte le schéma à quatre tables, au prix de ne compter que les appels qui aboutissent
  jusqu'à l'insertion (un utilisateur ne peut donc pas être bloqué par des tentatives qui
  échouent avant ce point, ce qui reste un risque d'abus mineur à surveiller en production).
  `tsconfig.json` exclut désormais `supabase/functions` (runtime Deno, pas Node) ; ces fichiers
  sont vérifiés séparément avec `deno check` / `deno lint`, pas par `npm run typecheck`.

- **Étape 7** : le signalement (appui long sur une accroche) écrit directement dans la table
  `signalements` depuis le client — la RLS de l'étape 3 l'autorise déjà et le brief ne prévoit
  pas d'Edge Function dédiée à cette action, contrairement à `generate`. Les favoris affichés
  sur l'écran Créer sont pour l'instant un état local (étoile qui bascule visuellement) : la
  persistance réelle dans la table `favoris` arrive à l'étape 8, qui couvre justement « favoris
  et historique, avec synchronisation serveur ». `SqueletteCarte` (nouveau composant partagé)
  reprend le gabarit de `HookCard` avec des barres qui pulsent : prévu pour être réutilisé par
  l'état de chargement de l'historique à l'étape 8. Les exemples de sujet contextualisés à la
  niche (placeholder du champ) sont un texte par niche inventé pour ce projet, faute
  d'exemples fournis par le brief.

- **Étape 8** : les favoris de l'écran Créer basculent désormais vraiment sur la table
  `favoris` (la version locale de l'étape 7 est remplacée). L'écran Historique et l'écran Créer
  restent tous les deux montés en permanence dans le `Tabs` racine ; pour transporter « sujet,
  réglages et résultats » d'un tap sur une entrée d'historique jusqu'à l'écran Créer, un store
  Zustand dédié (`store/reprise.ts`) sert de pont, avec un compteur de version plutôt qu'un
  `useEffect` consommateur : la mise à jour de l'état local se fait pendant le rendu (comparaison
  pure de version), ce qui satisfait la nouvelle règle de lint `react-hooks/set-state-in-effect`
  sans perdre le comportement. `Swipeable` (l'API classique de react-native-gesture-handler, pas
  `ReanimatedSwipeable` qui n'est pas encore ré-exportée publiquement dans la version installée)
  gère le glissement latéral pour retirer un favori. Les dates de l'historique utilisent
  `Intl.RelativeTimeFormat('fr')`, disponible nativement sur Hermes dans les versions récentes de
  React Native ; sur une configuration plus ancienne il faudrait le polyfill
  `@formatjs/intl-relativetimeformat`.
