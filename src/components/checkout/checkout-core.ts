import { useCallback, useEffect, useRef, useState } from "react";

export const PAYEE_NAME = "Velqorfi";

export function buildUpiUri(amount: number, upiId: string) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${PAYEE_NAME}&am=${amount.toFixed(2)}&cu=INR&tn=Velqorfi%20Order`;
}

export function appDeepLink(app: "paytm" | "phonepe", amount: number, upiId: string) {
  const query = `pa=${encodeURIComponent(upiId)}&pn=${PAYEE_NAME}&am=${amount.toFixed(2)}&cu=INR&tn=Velqorfi%20Order`;
  return app === "paytm"
    ? `paytmmp://pay?${query}`
    : `phonepe://pay?${query}`;
}

export function useCountdown(totalSeconds: number) {
  const [left, setLeft] = useState(totalSeconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return { left, mmss: `${m}:${s}`, hhmmss: `${h}:${m}:${s}` };
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);
  return { copied, copy };
}

export function useSaveQr() {
  const qrRef = useRef<HTMLDivElement>(null);
  const saveQr = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upi-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  return { qrRef, saveQr };
}

export function useUtr(onDone: (utr: string) => void | Promise<void>) {
  const [utr, setUtr] = useState("");
  const submit = () => {
    if (utr.length >= 12) void onDone(utr);
  };
  return {
    utr,
    setUtr: (v: string) => setUtr(v.replace(/\D/g, "").slice(0, 12)),
    submit,
    valid: utr.length >= 12,
  };
}
