/**
 * Order amount limits (in INR).
 * Change MIN_INR / MAX_INR here and both the website popup and the
 * server-side order check will use the new numbers.
 */
export const MIN_INR = 1345;
export const MAX_INR = 35651;

type RateLike = { code: string; rate: number };

/** Round to 2 decimals without trailing ".00" (for non-INR display). */
function fmt(n: number) {
  return String(Number(n.toFixed(2)));
}

/**
 * Returns the popup message if `amount` (in `fiat`) is outside the allowed
 * range, otherwise null. For non-INR currencies the INR limits are converted
 * with the same live rates the quote uses.
 */
export function limitError(
  amount: number,
  fiat: RateLike,
  inr: RateLike | undefined,
): string | null {
  const a = Number.isFinite(amount) ? amount : 0;

  if (fiat.code === "INR") {
    if (a < MIN_INR) return `Minimum is ₹${MIN_INR}.`;
    if (a > MAX_INR) return `Maximum limit for your account is ₹${MAX_INR}.`;
    return null;
  }

  // Non-INR: convert the INR limits into the selected currency.
  if (!inr || !inr.rate || !fiat.rate) return null;
  const perInr = fiat.rate / inr.rate; // 1 INR in `fiat`
  const min = Math.ceil(MIN_INR * perInr * 100) / 100;
  const max = Math.floor(MAX_INR * perInr * 100) / 100;
  if (a < min) return `Minimum is ${fmt(min)} ${fiat.code}.`;
  if (a > max) {
    return `Maximum limit for your account is ${fmt(max)} ${fiat.code}.`;
  }
  return null;
}
