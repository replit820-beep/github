import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const requestEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email().max(160) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { issueOtp, normalizeEmail } = await import("@/lib/auth-otp.server");
    await issueOtp(normalizeEmail(data.email));
    return { sent: true };
  });

export const verifyEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email().max(160),
        code: z.string().regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyOtp, normalizeEmail } = await import("@/lib/auth-otp.server");
    const token = await verifyOtp(normalizeEmail(data.email), data.code);
    return { token };
  });
