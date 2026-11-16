import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export type FirebaseUser = { uid: string; email: string };

export async function verifyIdToken(idToken: string): Promise<FirebaseUser> {
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured");
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const uid = (payload.sub ?? payload["user_id"]) as string | undefined;
  if (!uid) throw new Error("Invalid Firebase ID token");
  return { uid, email: (payload["email"] as string | undefined) ?? "" };
}
