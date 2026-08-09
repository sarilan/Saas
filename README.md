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
npm run ios      # simulateur iOS
npm run typecheck
npm run lint
```

## Hypothèses

Ce projet est réalisé sans aller-retour de clarification, conformément à la section 10 du brief.
Les décisions prises en l'absence de précision explicite sont documentées ici au fil des étapes :

- **Étape 1** : le bundle identifier iOS/Android provisoire est `com.hookgen.app` (à remplacer
  par l'identifiant réel avant soumission App Store). Navigation `(app)` implémentée en barre
  d'onglets (Créer, Favoris, Historique, Compte), cohérent avec les quatre écrans principaux
  listés à la section 4. `userInterfaceStyle` réglé sur `dark` puisque la direction design
  (section 3) est exclusivement sombre — pas de mode clair prévu, et la section 10 exclut
  explicitement un mode sombre "optionnel" (donc le mode sombre est permanent, pas un choix).
