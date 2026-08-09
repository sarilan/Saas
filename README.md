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
supabase secrets set REVENUECAT_WEBHOOK_SECRET=... REVENUECAT_SECRET_API_KEY=sk_...
supabase functions deploy generate
supabase functions deploy revenuecat-webhook
supabase functions deploy delete-account
```

Configurer ensuite dans le dashboard RevenueCat un webhook pointant vers l'URL de la fonction
`revenuecat-webhook`, avec un en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées
automatiquement par la plateforme dans chaque Edge Function ; seule `ANTHROPIC_API_KEY` doit
être définie manuellement, et uniquement comme secret de fonction — jamais dans le `.env` du
client.

## Build EAS

```bash
npx eas-cli login
npx eas-cli init                       # lie le projet, renseigne extra.eas.projectId
npx eas-cli build --profile development --platform ios   # build simulateur, développement
npx eas-cli build --profile preview --platform ios        # build interne, appareil réel
npx eas-cli build --profile production --platform ios     # build de soumission
npx eas-cli submit --profile production --platform ios
```

Les profils `eas.json` transmettent les variables `EXPO_PUBLIC_*` au build ; elles doivent être
enregistrées comme variables d'environnement EAS (`eas env:create`) plutôt que commitées.
`eas init` n'a pas été exécuté dans ce dépôt (pas de compte Expo/EAS disponible pendant la
réalisation) : `app.json` n'a donc pas encore de `extra.eas.projectId` ni de `owner` — la
première exécution d'`eas init` les ajoutera automatiquement.

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

- **Étape 9** : les identifiants de produit (`hookgen.pro.mensuel`, `hookgen.pro.annuel`) et le
  groupe d'abonnement doivent être créés dans App Store Connect puis mappés à une offre
  RevenueCat ; le paywall n'affiche que ce que renvoient les objets `PurchasesPackage` /
  `PurchasesStoreProduct` (nom, prix, période, prix mensuel équivalent), jamais de constante —
  conforme à la guideline 3.1.2. L'identifiant d'entitlement RevenueCat est fixé à `pro`
  (`IDENTIFIANT_ENTITLEMENT_PRO` dans `lib/purchases.ts`), une convention prise faute de valeur
  imposée par le brief, à faire correspondre au dashboard réel. `Purchases.logIn(userId)` est
  appelé avec l'id utilisateur Supabase dès qu'une session existe, pour que le webhook
  RevenueCat sache à quel `profiles.id` rattacher un événement. Ce webhook
  (`supabase/functions/revenuecat-webhook`) ne cherche pas à interpréter le champ `event.type`
  (fragile) mais relit l'état d'abonné faisant autorité via l'API REST RevenueCat à chaque
  appel, comme recommandé par RevenueCat elle-même, puis écrit `abonnement_actif` en base — le
  client ne peut pas modifier cette colonne (grant restreint posé à l'étape 6). Après un achat ou
  une restauration, le profil est réinvalidé plusieurs fois avec un léger délai pour rattraper la
  propagation asynchrone du webhook, l'app ne bloquant jamais l'utilisateur en attendant. Le
  paywall est une route top-level (`app/paywall.tsx`, présentée en modal) plutôt qu'un écran
  dans `(app)` : il doit rester atteignable depuis Créer (quota épuisé) et depuis Compte sans
  faire partie de la navigation par onglets. « Restaurer mes achats » est présent à la fois sur
  le paywall et sur Compte, et la gestion d'abonnement pointe vers
  `itms-apps://apps.apple.com/account/subscriptions`, conformément aux points 4 et 5 de la
  section 5. Le compte de démonstration avec accès Pro actif pour les revieweurs Apple
  (guideline 2.1) est une tâche opérationnelle sur le dashboard RevenueCat/App Store Connect,
  documentée dans les notes de revue à l'étape 12, pas dans le code.

- **Étape 10** : la suppression de compte passe par une nouvelle Edge Function
  (`supabase/functions/delete-account`) plutôt qu'un appel client direct : supprimer une ligne
  `auth.users` nécessite la clé de service, jamais exposée côté client. `profiles`,
  `generations` et `favoris` disparaissent par cascade ; `signalements` — sans cascade par
  décision de l'étape 3 — est explicitement vidé pour cet utilisateur dans la même fonction,
  pour respecter la guideline 5.1.1(v) (« efface les données côté serveur »). Le parcours tient
  en deux taps : ouvrir la feuille de confirmation, puis confirmer. Le texte de confirmation
  prévient qu'un abonnement Apple actif doit être annulé séparément, la suppression du compte
  n'annulant pas automatiquement un abonnement StoreKit. Niche/plateforme/ton deviennent
  modifiables directement depuis Compte (écriture client autorisée par le grant par colonne posé
  à l'étape 3) sans repasser par l'onboarding. Les liens CGU/confidentialité et l'adresse de
  contact (section 7, point 3) sont désormais aussi présents sur Compte, en plus de l'accueil et
  du paywall.

- **Étape 11** : passe d'accessibilité complète sur l'app.
  - *Dynamic Type* : `theme/tokens.ts` n'impose plus de `lineHeight` fixe en points sur les
    styles de texte (`grandTitre`, `titre`, `corps`, `microLibelle`) — une valeur figée ne suit
    pas la mise à l'échelle du texte système et finit par tronquer les lignes aux plus grandes
    tailles d'accessibilité ; laisser React Native calculer l'interligne naturel scale
    correctement. Seul `accroche` garde un ratio explicite (1.34, imposé par le brief), calculé
    à l'usage dans `HookCard` via `PixelRatio.getFontScale()`.
  - *VoiceOver* : `HookCard` est un seul élément d'accessibilité opaque (un parent `accessible`
    masque de toute façon ses enfants à VoiceOver) avec un label complet (texte, durée, statut
    budget, statut favori) et expose favori/signalement comme `accessibilityActions` plutôt que
    des sous-contrôles inatteignables. `Meter` porte enfin son propre
    `accessibilityRole="progressbar"` avec la durée en valeur — il n'avait aucune sémantique
    d'accessibilité depuis l'étape 2, alors que le brief l'exige explicitement (« y compris
    l'étoile et la barre de durée »). Le texte de durée visuel redondant est masqué de l'arbre
    d'accessibilité (`accessibilityElementsHidden`) pour éviter une double annonce.
  - *Contraste* : audit chiffré (formule WCAG) de toutes les paires texte/fond de la palette.
    Deux vraies violations trouvées et corrigées : le texte `craie` sur puce/bouton/badge violet
    ne passait qu'à 3,53:1 (`Chip` actif, badge « Économise X % » du paywall) — remplacé par
    `nuit`, seul choix conforme sur ce fond (même logique déjà appliquée à `Cta` primaire à
    l'étape 2). Le texte `nuit` sur fond violet lui-même ne passait qu'à 4,49:1, sous le seuil
    de 4,5:1 — le jeton `violet` est décalé de `#7B61FF` à `#8167FF` (imperceptible visuellement,
    remonte le contraste à 4,78:1). Un nouveau jeton `violetClair` (`#A08CFF`) est réservé au
    texte/icône sur fond sombre (ex. onglet actif) : `violet` de base n'y passait qu'à ~4,15:1.
  - *Mouvement réduit* : nouveau hook `useReduceMotion` (lit `AccessibilityInfo.isReduceMotionEnabled`
    et s'abonne à `reduceMotionChanged`). `Meter`, `Sheet`, `Toast` et `SqueletteCarte` sautent
    directement à l'état final (durée à 0, ou rendu statique pour le squelette) plutôt que de
    seulement raccourcir leurs animations, conformément à « coupées, pas seulement raccourcies ».
  - *Zones sûres* : la plupart des écrans utilisaient un `paddingTop` fixe approximatif plutôt
    que les vraies valeurs d'insets — fragile d'un appareil à l'autre (encoche, Dynamic Island)
    et ne gérait jamais l'indicateur d'accueil en bas. Tous les écrans passent par `SafeAreaView`
    de `react-native-safe-area-context` : `top`+`bottom` pour les écrans hors onglets, `top`
    seul dans `(app)` (la barre d'onglets gère déjà son propre inset bas), `bottom` seul pour les
    pages légales (leur en-tête natif gère le haut). Au passage, Favoris et Historique, qui
    n'étaient pas défilables, sont passés dans un `ScrollView` — sans quoi une longue liste
    aurait débordé de l'écran sans recours.
  - L'écran `/demo` (outil de développement interne, hors périmètre App Store) n'a pas reçu
    cette passe : ce n'est pas un écran du parcours utilisateur réel.

- **Étape 12** : `eas.json` définit trois profils (`development`, `preview`, `production`) qui
  transmettent les variables `EXPO_PUBLIC_*` au build ; le projet n'a jamais été lié à un compte
  EAS réel pendant la réalisation (`eas init` reste à exécuter, ce qui ajoutera
  `extra.eas.projectId`/`owner` à `app.json`). L'icône, l'icône adaptative Android et l'écran de
  lancement sont générés par un script Python/Pillow ad hoc (`theme/tokens.ts` → nuit + violet,
  monogramme « H » en Archivo ExtraBold) faute d'outil de génération d'image dans cet
  environnement : un vrai jeu d'icônes dessiné par un designer doit remplacer ces fichiers avant
  soumission — ils respectent la direction (sombre, dense, typographique, sans dégradé ni
  illustration) mais n'ont pas la finition d'un travail de design final. `PrivacyInfo.xcprivacy`
  est déclaré via `expo.ios.privacyManifests` dans `app.json` (mécanisme natif Expo depuis le SDK
  50, qui génère le fichier réel au build) plutôt qu'un fichier XML statique dans un dossier
  `ios/` inexistant en workflow managé. Les catégories déclarées correspondent aux données
  réellement collectées (identifiant de compte, e-mail, contenu utilisateur soumis) et aux trois
  API à raison requise citées par le brief (espace disque, horodatage de fichier, préférences
  utilisateur) — les codes de raison (`E174.1`, `C617.1`, `CA92.1`) sont les plus généralement
  applicables pour ces catégories ; à revérifier contre l'usage réel des dépendances natives une
  fois le premier build EAS produit (`eas build` peut lister les APIs à raison requise
  effectivement utilisées). Les notes de revue App Store
  (`docs/app-store-review-notes.md`) documentent explicitement pourquoi un compte de démonstration
  classique par OTP est impraticable pour un reviewer Apple et proposent deux solutions, à
  trancher avant soumission — c'est la seule partie de la guideline 2.1 qui ne peut pas être
  résolue uniquement par du code.

## Écarts connus par rapport à un livrable prêt pour la soumission App Store

Ce dépôt réalise l'intégralité des 12 étapes du brief avec un code fonctionnel et testé
(`npm run typecheck`, `npm run lint`, `deno check`/`deno lint` sur les Edge Functions, export
Metro réussi après chaque étape). Ce qui reste explicitement hors de portée d'une session de
génération de code, noté ici plutôt que passé sous silence :

- Aucun projet Supabase, RevenueCat ou compte Apple Developer réel n'a été provisionné : les
  identifiants dans `.env`/les secrets de fonctions sont à renseigner par qui déploie ce dépôt.
- L'icône et l'écran de lancement sont un placeholder généré par script, pas un travail de
  design final.
- Le compte de démonstration pour la revue Apple (guideline 2.1) doit être créé manuellement
  (voir `docs/app-store-review-notes.md`).
- Les textes juridiques (`/mentions-legales`, `/confidentialite`) sont un contenu générique
  écrit pour ce projet, à faire relire par un juriste.
- `eas init` n'a pas été exécuté : pas de `projectId` EAS lié.
