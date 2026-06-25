import { useEffect, useState } from "react";

const UPI_KEY = "velqorfi.paymentSettings.upiId";
const QR_KEY = "velqorfi.paymentSettings.qrImage";
const EVT = "velqorfi:payment-settings-updated";

export const DEFAULT_UPI_ID = "velqorfi@upi";

export type PaymentSettings = {
  upiId: string;
  qrImage: string | null; // data URL of uploaded image, or null = auto-generate
};

function read(): PaymentSettings {
  if (typeof window === "undefined") {
    return { upiId: DEFAULT_UPI_ID, qrImage: null };
  }
  return {
    upiId: window.localStorage.getItem(UPI_KEY) || DEFAULT_UPI_ID,
    qrImage: window.localStorage.getItem(QR_KEY),
  };
}

export function getPaymentSettings(): PaymentSettings {
  return read();
}

export function setUpiId(upiId: string) {
  window.localStorage.setItem(UPI_KEY, upiId);
  window.dispatchEvent(new Event(EVT));
}

export function setQrImage(dataUrl: string | null) {
  if (dataUrl) window.localStorage.setItem(QR_KEY, dataUrl);
  else window.localStorage.removeItem(QR_KEY);
  window.dispatchEvent(new Event(EVT));
}

export function usePaymentSettings(): PaymentSettings {
  const [s, setS] = useState<PaymentSettings>(() => read());
  useEffect(() => {
    const onChange = () => setS(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return s;
}

// --- Admin session (DEMO ONLY — not real auth) ---
const ADMIN_KEY = "velqorfi.admin.session";
export const ADMIN_USER = "hello";
export const ADMIN_PASS = "hell0";

export function adminLogin(user: string, pass: string): boolean {
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    window.sessionStorage.setItem(ADMIN_KEY, "1");
    return true;
  }
  return false;
}

export function adminLogout() {
  window.sessionStorage.removeItem(ADMIN_KEY);
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_KEY) === "1";
}
