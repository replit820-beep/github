import QRCode from "react-qr-code";
import { PaytmMark, PhonePeMark } from "./marks";
import {
  appDeepLink,
  buildUpiUri,
  useCopy,
  useCountdown,
  useSaveQr,
  useUtr,
} from "./checkout-core";

type Props = {
  payable: number;
  onPaid: (utr: string) => void | Promise<void>;
  upiId: string;
};

export function CheckoutTeal({ payable, onPaid, upiId }: Props) {
  const { hhmmss } = useCountdown(20 * 60);
  const { copied, copy } = useCopy();
  const { qrRef, saveQr } = useSaveQr();
  const utr = useUtr(onPaid);

  return (
    <main className="min-h-screen bg-white font-payment">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#7b2ff7_0%,#e94b8b_55%,#f7971e_100%)]" />

      <section className="px-4 pt-4 text-center">
        <p className="text-[17px] text-ckt-ink">Amount Payable</p>
        <p className="mt-2 text-[40px] font-bold leading-none text-ckt-teal">
          ₹{payable}
        </p>
        <p className="mt-3 text-[22px] text-ckt-muted tabular-nums">{hhmmss}</p>
        <p className="mt-3 text-[19px] text-ckt-muted">
          Use Mobile Scan code to pay
        </p>
      </section>

      <div ref={qrRef} className="mt-5 flex justify-center">
        <QRCode value={buildUpiUri(payable, upiId)} size={160} />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={saveQr}
          className="rounded-md border border-ckt-line px-6 py-2 text-[15px] font-semibold text-ckt-muted"
        >
          Save QR Code
        </button>
      </div>

      <section className="mt-6 px-4">
        <h2 className="font-payment tracking-normal text-[19px] text-ckt-ink">Choose a payment method to pay</h2>

        <a
          href={appDeepLink("paytm", payable, upiId)}
          className="mt-4 flex items-center gap-4 rounded-lg border border-ckt-line px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <PaytmMark className="h-5 w-[58px] shrink-0" />
          <span className="text-[21px] font-bold text-ckt-ink">Paytm</span>
        </a>

        <a
          href={appDeepLink("phonepe", payable, upiId)}
          className="mt-4 flex items-center gap-4 rounded-lg border border-ckt-line px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <PhonePeMark className="h-8 w-8 shrink-0" />
          <span className="text-[21px] font-bold text-ckt-ink">PhonePe</span>
        </a>
      </section>

      <section className="mt-6 px-4 pb-14">
        <h2 className="font-payment tracking-normal text-[19px] text-ckt-ink">Manual transfer</h2>

        <div className="mt-3 rounded-lg border border-ckt-line p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-[19px] font-bold text-ckt-ink">
            Method2: Manual transfer
          </p>
          <p className="mt-3 text-[17px] font-semibold text-ckt-teal">
            1.Copy the below given UPI
          </p>
          <div className="mt-2 flex overflow-hidden rounded-md border border-ckt-line bg-ckt-field">
            <span className="flex-1 truncate px-3 py-3 text-[16px] text-ckt-muted">
              {upiId}
            </span>
            <button
              type="button"
              onClick={() => copy(upiId)}
              className="bg-ckt-teal px-6 text-[17px] font-semibold text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="mt-4 text-[17px] font-semibold text-ckt-teal">
            2.Enter the 12-digit UTR number
          </p>
          <input
            value={utr.utr}
            onChange={(e) => utr.setUtr(e.target.value)}
            inputMode="numeric"
            placeholder="Enter UTR / Reference no."
            className="mt-2 h-12 w-full rounded-md border border-ckt-line bg-ckt-field px-3 text-[16px] tracking-[0.06em] text-ckt-ink outline-none focus:border-ckt-teal"
          />
          <button
            type="button"
            onClick={utr.submit}
            disabled={!utr.valid}
            className="mt-3 h-12 w-full rounded-md bg-ckt-teal text-[17px] font-bold text-white disabled:opacity-40"
          >
            Submit UTR
          </button>
        </div>
      </section>
    </main>
  );
}
