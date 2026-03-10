import { getCurrentLanguage } from "@/utils/i18n";

type FbqFn = (...args: unknown[]) => void;

const getFbq = (): FbqFn | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { fbq?: FbqFn };
  if (typeof w.fbq === "function") return w.fbq;
  if (typeof (globalThis as any)?.fbq === "function") return (globalThis as any).fbq as FbqFn;
  return null;
};

const safeTrack = (eventName: string, params?: Record<string, unknown>) => {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    if (params) {
      fbq("track", eventName, params);
      return;
    }
    fbq("track", eventName);
  } catch {
    return;
  }
};

const toNumberOrNull = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
};

export const getCurrencyByLocale = (locale: string): string => {
  if (String(locale).toLowerCase().startsWith("pt")) return "BRL";
  if (locale === "hi-IN") return "INR";
  if (locale === "en-US") return "USD";
  return "VND";
};

export const getCurrencyByOrderId = (orderId: string): string => {
  if (orderId.startsWith("VN_")) return "VND";
  if (orderId.startsWith("HI_") || orderId.startsWith("IN_")) return "INR";
  if (orderId.startsWith("BR_")) return "BRL";
  if (orderId.startsWith("US_")) return "USD";
  return getCurrencyByLocale(getCurrentLanguage());
};

export const trackCompleteRegistration = () => {
  safeTrack("CompleteRegistration");
};

export const trackInitiateCheckout = (payload: { value: number; currency: string }) => {
  const value = toNumberOrNull(payload.value);
  if (value === null) return;
  safeTrack("InitiateCheckout", { value, currency: payload.currency });
};

export const trackPurchase = (payload: { value: number; currency: string; orderId?: string }) => {
  const value = toNumberOrNull(payload.value);
  if (value === null) return;

  const orderId = payload.orderId;
  if (orderId && typeof window !== "undefined") {
    const key = `fbq_purchase_${orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }

  safeTrack("Purchase", { value, currency: payload.currency });
};
