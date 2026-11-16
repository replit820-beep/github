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

export type BotAwaiting =
  | "upi_add"
  | "bank_name"
  | "bank_holder"
  | "bank_account"
  | "bank_ifsc"
  | "none";

export async function setBotState(
  chatId: string,
  awaiting: BotAwaiting,
  draft: Record<string, string> = {},
) {
  await setDocument("telegram_bot_state", chatId, {
    awaiting,
    draft: JSON.stringify(draft),
    updatedAt: new Date().toISOString(),
  });
}

export async function getBotState(chatId: string) {
  const state = await getDocument("telegram_bot_state", chatId);
  return String(state?.["awaiting"] ?? "none");
}

export async function getBotDraft(chatId: string): Promise<Record<string, string>> {
  const state = await getDocument("telegram_bot_state", chatId);
  try {
    return JSON.parse(String(state?.["draft"] ?? "{}")) as Record<string, string>;
  } catch {
    return {};
  }
}

// ---------- Bank accounts (IMPS) ----------

export type BankAccount = {
  id: string;
  bankName: string;
  holderName: string;
  accountNumber: string;
  ifsc: string;
};

export function validAccountNumber(value: string) {
  return /^[0-9]{6,20}$/.test(value.replace(/\s+/g, ""));
}

export function validIfsc(value: string) {
  return /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(value.trim());
}

export async function listBanks(): Promise<BankAccount[]> {
  const docs = await listDocuments("payment_banks");
  return docs
    .map((doc) => ({
      id: String(doc["id"] ?? ""),
      bankName: String(doc["bankName"] ?? ""),
      holderName: String(doc["holderName"] ?? ""),
      accountNumber: String(doc["accountNumber"] ?? ""),
      ifsc: String(doc["ifsc"] ?? ""),
    }))
    .filter((b) => b.id && b.accountNumber && b.ifsc);
}

export async function addBank(input: Omit<BankAccount, "id">): Promise<BankAccount> {
  const accountNumber = input.accountNumber.replace(/\s+/g, "");
  const ifsc = input.ifsc.trim().toUpperCase();
  if (!validAccountNumber(accountNumber)) throw new Error("Invalid account number");
  if (!validIfsc(ifsc)) throw new Error("Invalid IFSC code");
  const id = createHash("sha256").update(`${accountNumber}:${ifsc}`).digest("hex").slice(0, 24);
  const bank = {
    bankName: input.bankName.trim().slice(0, 80),
    holderName: input.holderName.trim().slice(0, 80),
    accountNumber,
    ifsc,
  };
  await setDocument("payment_banks", id, { ...bank, updatedAt: new Date().toISOString() });
  return { id, ...bank };
}

export async function removeBank(id: string) {
  await deleteDocument("payment_banks", id);
}

export async function randomBank(): Promise<BankAccount | null> {
  const banks = await listBanks();
  if (!banks.length) return null;
  return banks[Math.floor(Math.random() * banks.length)] ?? null;
}