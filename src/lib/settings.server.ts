import { getDocument, setDocument } from "./firestore.server";

const COLLECTION = "app_settings";
const DOC_ID = "rates";

/**
 * Manual INR rate for 1 USD / 1 USDT (e.g. 96 means 1 USDT = ₹96).
 * Every other coin is priced from its live USD price multiplied by this rate.
 */
export async function getInrRate(): Promise<number | null> {
  try {
    const doc = await getDocument(COLLECTION, DOC_ID);
    const value = Number(doc?.["inr"] ?? 0);
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function setInrRate(value: number): Promise<number> {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Invalid rate");
  const rate = Math.round(value * 100) / 100;
  await setDocument(COLLECTION, DOC_ID, {
    inr: rate,
    updatedAt: new Date().toISOString(),
  });
  return rate;
}
