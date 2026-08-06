import { createHash } from "node:crypto";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  setDocument,
} from "./firestore.server";

const DEFAULT_UPI = "wtfvinayak@fam";
const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export type UpiAccount = { id: string; upiId: string };

function upiDocumentId(upiId: string) {
  return createHash("sha256").update(upiId.toLowerCase()).digest("hex").slice(0, 24);
}

export function validUpiId(value: string) {
  return UPI_PATTERN.test(value.trim());
}

export async function listUpis(): Promise<UpiAccount[]> {
  const docs = await listDocuments("payment_upis");
  const accounts = docs
    .map((doc) => ({ id: String(doc["id"] ?? ""), upiId: String(doc["upiId"] ?? "") }))
    .filter((account) => account.id && validUpiId(account.upiId));
  if (accounts.length) return accounts;

  const fallback = process.env["DEFAULT_UPI_ID"]?.trim() || DEFAULT_UPI;
  const account = await addUpi(fallback);
  return [account];
}

export async function addUpi(value: string): Promise<UpiAccount> {
  const upiId = value.trim().toLowerCase();
  if (!validUpiId(upiId)) throw new Error("Invalid UPI ID");
  const id = upiDocumentId(upiId);
  await setDocument("payment_upis", id, {
    upiId,
    active: true,
    updatedAt: new Date().toISOString(),
  });
  return { id, upiId };
}

export async function removeUpi(id: string) {
  const accounts = await listUpis();
  if (accounts.length <= 1) throw new Error("At least one UPI ID must remain");
  await deleteDocument("payment_upis", id);
}

export async function randomUpi(): Promise<UpiAccount> {
  const accounts = await listUpis();
  const index = Math.floor(Math.random() * accounts.length);
  return accounts[index] ?? accounts[0] ?? addUpi(DEFAULT_UPI);
}

export async function setBotState(chatId: string, awaiting: "upi_add" | "none") {
  await setDocument("telegram_bot_state", chatId, {
    awaiting,
    updatedAt: new Date().toISOString(),
  });
}

export async function getBotState(chatId: string) {
  const state = await getDocument("telegram_bot_state", chatId);
  return String(state?.["awaiting"] ?? "none");
}