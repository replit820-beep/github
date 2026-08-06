import { SignJWT, importPKCS8 } from "jose";

const FIRESTORE = "https://firestore.googleapis.com/v1";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function privateKey(): string {
  return env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp > now + 60) return cached.token;

  const key = await importPKCS8(privateKey(), "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/datastore",
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
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`Google token request failed: ${JSON.stringify(body)}`);
  }
  cached = { token: body.access_token, exp: now + 3000 };
  return body.access_token;
}

type FsValue = Record<string, unknown>;

function toValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  return { stringValue: String(v) };
}

export function documentId(doc: { name?: string }): string {
  return doc.name?.split("/").pop() ?? "";
}

export function fromDoc(doc: {
  name?: string;
  fields?: Record<string, Record<string, unknown>>;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(doc.fields ?? {})) {
    const [type, value] = Object.entries(raw)[0] ?? [];
    out[k] =
      type === "integerValue"
        ? Number(value)
        : type === "doubleValue"
          ? Number(value)
          : type === "booleanValue"
            ? Boolean(value)
            : type === "nullValue"
              ? null
              : value;
  }
  if (doc.name) out["id"] = doc.name.split("/").pop();
  return out;
}

function base(): string {
  return `${FIRESTORE}/projects/${env("FIREBASE_PROJECT_ID")}/databases/(default)/documents`;
}

export async function createDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>,
) {
  const token = await accessToken();
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toValue(v);
  const res = await fetch(
    `${base()}/${collection}?documentId=${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) {
    throw new Error(`Firestore create failed [${res.status}]: ${await res.text()}`);
  }
  return fromDoc((await res.json()) as never);
}

export async function patchDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>,
) {
  const token = await accessToken();
  const fields: Record<string, FsValue> = {};
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  for (const [k, v] of Object.entries(data)) fields[k] = toValue(v);
  const res = await fetch(
    `${base()}/${collection}/${encodeURIComponent(id)}?${mask}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) {
    throw new Error(`Firestore patch failed [${res.status}]: ${await res.text()}`);
  }
  return fromDoc((await res.json()) as never);
}

export async function setDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>,
) {
  const token = await accessToken();
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toValue(v);
  const res = await fetch(
    `${base()}/${collection}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) {
    throw new Error(`Firestore set failed [${res.status}]: ${await res.text()}`);
  }
  return fromDoc((await res.json()) as never);
}

export async function deleteDocument(collection: string, id: string) {
  const token = await accessToken();
  const res = await fetch(`${base()}/${collection}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Firestore delete failed [${res.status}]: ${await res.text()}`);
  }
}

export async function listDocuments(
  collection: string,
): Promise<Array<Record<string, unknown>>> {
  const token = await accessToken();
  const documents: Array<{
    name?: string;
    fields?: Record<string, Record<string, unknown>>;
  }> = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);
    const res = await fetch(`${base()}/${collection}?${query}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return [];
    if (!res.ok) {
      throw new Error(`Firestore list failed [${res.status}]: ${await res.text()}`);
    }
    const body = (await res.json()) as {
      documents?: typeof documents;
      nextPageToken?: string;
    };
    documents.push(...(body.documents ?? []));
    pageToken = body.nextPageToken ?? "";
  } while (pageToken);
  return documents.map((doc) => ({ ...fromDoc(doc), id: documentId(doc) }));
}

export async function getDocument(collection: string, id: string) {
  const token = await accessToken();
  const res = await fetch(`${base()}/${collection}/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return fromDoc((await res.json()) as never);
}
