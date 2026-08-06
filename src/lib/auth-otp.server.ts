import { SignJWT, importPKCS8 } from "jose";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { deleteDocument, getDocument, setDocument } from "./firestore.server";

const IDENTITY = "https://identitytoolkit.googleapis.com/v1";
const OTP_COLLECTION = "email_otps";
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function privateKey() {
  return importPKCS8(env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"), "RS256");
}

/** OAuth access token for the Identity Toolkit admin API. */
async function accessToken(): Promise<string> {
  const key = await privateKey();
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope:
      "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(env("FIREBASE_CLIENT_EMAIL"))
    .setSubject(env("FIREBASE_CLIENT_EMAIL"))
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token failed [${res.status}]`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

function otpDocId(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 32);
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Creates a 6-digit code, stores its hash, and emails it to the user. */
export async function issueOtp(email: string): Promise<void> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await setDocument(OTP_COLLECTION, otpDocId(email), {
    codeHash: hashCode(email, code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  await sendOtpEmail(email, code);
}

async function sendOtpEmail(email: string, code: string) {
  const { sendEmail, otpEmail } = await import("./email.server");
  const mail = otpEmail(code);
  await sendEmail(email, mail.subject, mail.html);
}

/** Verifies the code and returns a Firebase custom token for the user. */
export async function verifyOtp(email: string, code: string): Promise<string> {
  const id = otpDocId(email);
  const doc = await getDocument(OTP_COLLECTION, id);
  if (!doc) throw new Error("Request a new code.");

  const attempts = Number(doc["attempts"] ?? 0);
  if (attempts >= MAX_ATTEMPTS) {
    await deleteDocument(OTP_COLLECTION, id);
    throw new Error("Too many attempts. Request a new code.");
  }
  if (Number(doc["expiresAt"] ?? 0) < Date.now()) {
    await deleteDocument(OTP_COLLECTION, id);
    throw new Error("Code expired. Request a new one.");
  }

  const expected = Buffer.from(String(doc["codeHash"] ?? ""));
  const actual = Buffer.from(hashCode(email, code));
  const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!ok) {
    await setDocument(OTP_COLLECTION, id, {
      codeHash: String(doc["codeHash"] ?? ""),
      expiresAt: Number(doc["expiresAt"] ?? 0),
      attempts: attempts + 1,
    });
    throw new Error("Incorrect code.");
  }

  await deleteDocument(OTP_COLLECTION, id);
  const uid = await findOrCreateUser(email);
  return createCustomToken(uid, email);
}

async function findOrCreateUser(email: string): Promise<string> {
  const token = await accessToken();
  const projectId = env("FIREBASE_PROJECT_ID");

  const lookup = await fetch(`${IDENTITY}/projects/${projectId}/accounts:lookup`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email: [email] }),
  });
  if (lookup.ok) {
    const body = (await lookup.json()) as { users?: Array<{ localId: string }> };
    const existing = body.users?.[0]?.localId;
    if (existing) return existing;
  }

  const created = await fetch(`${IDENTITY}/projects/${projectId}/accounts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, emailVerified: true }),
  });
  if (!created.ok) {
    throw new Error(`Could not create the account [${created.status}]`);
  }
  const body = (await created.json()) as { localId: string };
  return body.localId;
}

async function createCustomToken(uid: string, email: string): Promise<string> {
  const key = await privateKey();
  const now = Math.floor(Date.now() / 1000);
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  return new SignJWT({
    uid,
    claims: { email },
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(
      "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    )
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}
