import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// KYC is stored once per Gmail/email in the "kyc" collection.
const kycId = (email: string) => email.trim().toLowerCase();

export const getKycStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ idToken: z.string().min(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { getDocument } = await import("@/lib/firestore.server");
    const user = await verifyIdToken(data.idToken);
    const doc = (await getDocument("kyc", kycId(user.email))) as
      | { status?: string }
      | null;
    return { status: (doc?.status as string) ?? "none" };
  });

const img = z.string().startsWith("data:image/").max(700_000);

export const submitKyc = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        idToken: z.string().min(10),
        name: z.string().trim().min(2).max(80),
        age: z.number().int().min(18).max(120),
        country: z.string().min(2).max(60),
        state: z.string().min(1).max(80),
        region: z.string().min(1).max(80),
        pincode: z.string().min(3).max(12),
        address: z.string().trim().min(5).max(300),
        aadhaar: img,
        pan: img,
        selfie: img,
        consent: z.literal(true),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { setDocument } = await import("@/lib/firestore.server");
    const user = await verifyIdToken(data.idToken);
    const { idToken: _t, ...rest } = data;
    await setDocument("kyc", kycId(user.email), {
      ...rest,
      uid: user.uid,
      email: user.email,
      status: "verified",
      submittedAt: new Date().toISOString(),
    });
    try {
      const { sendEmail, kycVerifiedEmail } = await import("@/lib/email.server");
      const mail = kycVerifiedEmail(data.name);
      await sendEmail(user.email, mail.subject, mail.html);
    } catch (error) {
      console.error("KYC email failed", error);
    }
    return { status: "verified" };
  });
