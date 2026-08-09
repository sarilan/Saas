import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Identifiant d'entitlement configuré dans le dashboard RevenueCat pour
// l'accès Pro. Convention prise pour ce projet faute de valeur imposée par
// le brief — à faire correspondre au dashboard réel avant mise en prod.
export const IDENTIFIANT_ENTITLEMENT_PRO = 'pro';

const CLE_API_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;

let configure = false;

export function purchasesEstConfigure(): boolean {
  return Boolean(CLE_API_IOS);
}

export function configurerPurchases() {
  if (configure || !CLE_API_IOS) return;
  Purchases.configure({ apiKey: CLE_API_IOS });
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG).catch(() => {});
  }
  configure = true;
}

export async function synchroniserIdentiteUtilisateur(userId: string | null) {
  if (!configure) return;
  if (userId) {
    await Purchases.logIn(userId);
  } else {
    await Purchases.logOut();
  }
}

export function estAbonnePro(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[IDENTIFIANT_ENTITLEMENT_PRO]);
}

export async function recupererOffrePrincipale(): Promise<PurchasesOffering | null> {
  const offres = await Purchases.getOfferings();
  return offres.current;
}

export async function acheterForfait(forfait: PurchasesPackage): Promise<CustomerInfo> {
  const resultat = await Purchases.purchasePackage(forfait);
  return resultat.customerInfo;
}

export async function restaurerAchats(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export function formaterPeriode(periodeIso: string | null): string {
  switch (periodeIso) {
    case 'P1M':
      return 'par mois';
    case 'P1Y':
      return 'par an';
    case 'P1W':
      return 'par semaine';
    default:
      return periodeIso ?? '';
  }
}
