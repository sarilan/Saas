# Notes de revue App Store

Document interne (français) pour préparer la soumission ; le texte à coller tel quel dans le
champ « App Review Information » d'App Store Connect est fourni en anglais plus bas (Apple
recommande des notes de revue en anglais, la plupart des revieweurs ne lisant pas le français).

## À faire avant soumission (guideline 2.1)

Un testeur Apple doit pouvoir voir le produit derrière le paywall sans payer. Avant de soumettre :

1. Créer un compte de démonstration dédié (adresse e-mail réelle, ex. `revue@hookgen.app`),
   traverser l'onboarding une fois pour qu'il ait un profil complet.
2. Lui accorder l'entitlement `pro` directement depuis le dashboard RevenueCat (Customers →
   rechercher l'`app_user_id` du compte de démo → Grant entitlement), pour qu'`abonnement_actif`
   passe à `true` via le webhook sans passer par un vrai achat StoreKit.
3. Vérifier que le compte peut générer des accroches sans être bloqué par le quota (RevenueCat en
   mode sandbox n'affecte pas la génération, seul `abonnement_actif` compte côté Edge Function).
4. Renseigner l'adresse e-mail du compte de démo et le code OTP (ou configurer un mot de passe
   fixe côté Supabase Auth pour ce compte précis, puisque le flux normal utilise un code à usage
   unique renouvelé à chaque connexion — inadapté à un accès reviewer répété) dans les identifiants
   ci-dessous avant de coller les notes dans App Store Connect.

**Important** : le flux normal de HookGen n'utilise pas de mot de passe (OTP e-mail ou Sign in
with Apple). Un compte de test avec OTP à usage unique est impraticable pour un reviewer Apple.
Deux options :
- Configurer ce compte spécifique avec un mot de passe fixe via `supabase.auth.admin.updateUserById`
  (l'app devrait alors offrir un mode de connexion par mot de passe pour CE compte, ce qui
  suppose une petite adaptation du flux OTP côté client réservée aux comptes de test) ;
- Ou, plus simple : indiquer dans les notes que le code OTP a été envoyé à une boîte mail à
  laquelle Apple n'a pas accès, et demander explicitement l'activation du programme
  « Notarization/App Review contact » — en pratique, la solution recommandée pour les apps sans
  mot de passe est de fournir un compte Sign in with Apple pré-approuvé ou d'ajouter
  temporairement un mode « connexion démo » gated par une valeur d'environnement lue uniquement
  en interne, jamais exposée publiquement (à ne pas confondre avec du code caché prohibé par la
  guideline 2.3.1 : ce mode doit être documenté clairement dans les notes de revue elles-mêmes,
  pas dissimulé).

## Texte à coller dans App Store Connect (anglais)

```
HookGen generates short-video hooks from a subject, platform, and tone. Sign-in uses a one-time
email code or Sign in with Apple — there is no password-based login in the normal flow.

Demo account (already onboarded, Pro entitlement pre-granted so the paywall is not a blocker):
Email: [À COMPLETER avant soumission]
One-time code / access: [À COMPLETER — voir section "À faire avant soumission" plus haut]

Suggested test path:
1. Sign in with the demo account above.
2. On the Créer tab, type any subject (e.g. "3 tips for better sleep"), pick a platform and
   tone, and tap "Générer 20 accroches" to generate 20 hooks with an estimated spoken duration
   for each.
3. Tap a hook to copy it, tap the star to favorite it (visible under the Favoris tab), long-press
   a hook to open the report sheet ("Signaler cette accroche").
4. The Historique tab lists past generations; tapping one reloads its subject, settings, and
   results into Créer.
5. The Compte tab shows the current subscription status, lets you edit niche/platform/tone,
   manage or restore the subscription, and delete the account (two taps, with an explicit
   confirmation step).

Content moderation: subject submissions are screened before generation; disallowed topics
(sexual, hateful, violent content, or content targeting a named real person) are rejected with
a clear in-app message. Reports on generated hooks are logged server-side.

Privacy: no advertising SDK, no IDFA, no App Tracking Transparency prompt (none is shown because
no tracking occurs). Account deletion removes all associated data server-side, not just the
local session.

Support contact: support@hookgen.app
```

## Rappel des points de conformité déjà couverts par l'implémentation

- Achat intégré exclusif (RevenueCat/StoreKit), aucune mention de paiement externe (3.1.1).
- Prix, durée et équivalent mensuel affichés depuis les objets StoreKit réels (3.1.2).
- Liens CGU/confidentialité et mention du renouvellement automatique + fenêtre d'annulation de
  24 h sur le paywall.
- Bouton « Restaurer mes achats » sur le paywall et sur Compte.
- Gestion d'abonnement vers `itms-apps://apps.apple.com/account/subscriptions`.
- Suppression de compte en deux taps depuis Compte, effaçant les données côté serveur (5.1.1(v)).
- Sign in with Apple au même niveau visuel que la connexion par e-mail, scope minimal (4.8).
- Modération d'entrée, signalement en sortie, adresse de contact (section 7).
- Aucune fonctionnalité masquée ni code inactif en attente d'activation post-validation (2.3.1).
