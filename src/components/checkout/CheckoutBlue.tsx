import QRCode from "react-qr-code";
import { Copy, Check } from "lucide-react";
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
  original: number;
  onPaid: (utr: string) => void | Promise<void>;
  upiId: string;
};

export function CheckoutBlue({ payable, original, onPaid, upiId }: Props) {
  const { mmss } = useCountdown(8 * 60);
  const { copied, copy } = useCopy();
  const { qrRef, saveQr } = useSaveQr();
  const utr = useUtr(onPaid);

  return (
    <main className="min-h-screen bg-white font-payment">
      <header className="bg-ckb-blue py-4 text-center">
        <h1 className="font-payment text-[27px] font-extrabold lowercase tracking-tight text-white">
          payment
        </h1>
      </header>

      <section className="px-5 pt-7 text-center">
        <p className="text-[15px] text-ckb-muted">Amount Payable</p>
        <div className="mt-2 flex items-start justify-center gap-2">
          <p className="text-[46px] font-extrabold leading-none tracking-tight text-ckb-blue">
            ₹{payable.toFixed(2)}
          </p>
          <button
            type="button"
            aria-label="Copy amount"
            onClick={() => copy(payable.toFixed(2))}
            className="mt-2 text-ckb-blue"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-[19px] text-ckb-strike line-through">
          ₹{original}
        </p>
        <p className="mt-3 text-[20px] font-bold text-ckb-timer">{mmss}</p>
        <p className="mt-4 text-[20px] font-bold text-ckb-ink">
          Use Mobile Scan code to pay
        </p>
      </section>

      <div ref={qrRef} className="mt-6 flex justify-center">
        <QRCode value={buildUpiUri(payable, upiId)} size={150} />
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={saveQr}
          className="rounded-full border border-ckb-line px-8 py-2.5 text-[16px] font-bold text-ckb-ghost"
        >
          Save QR Code
        </button>
      </div>

      <section className="mt-7 px-5">
        <h2 className="font-payment tracking-normal text-[19px] font-bold text-ckb-ink">
          Choose a payment method to pay
        </h2>

        <a
          href={appDeepLink("paytm", payable, upiId)}
          className="mt-4 flex items-center gap-4 rounded-lg border border-ckb-line px-4 py-4"
        >
          <PaytmMark className="h-5 w-[62px] shrink-0" />
          <span className="h-6 w-px shrink-0 bg-ckb-line" />
          <span className="font-serif text-[18px] font-semibold text-ckb-ink">
            Paytm
          </span>
        </a>

        <a
          href={appDeepLink("phonepe", payable, upiId)}
          className="mt-3 flex items-center gap-4 rounded-lg border border-ckb-line px-4 py-4"
        >
          <PhonePeMark className="h-7 w-7 shrink-0" />
          <span className="h-6 w-px shrink-0 bg-ckb-line" />
          <span className="font-serif text-[18px] font-semibold text-ckb-ink">
            PhonePe
          </span>
        </a>
      </section>

      <section className="mt-7 px-5 pb-14">
        <h2 className="font-payment tracking-normal text-[19px] font-bold text-ckb-ink">Manual transfer</h2>
        <p className="mt-3 text-[15px] font-semibold text-ckb-blue">
          1. Copy the below given UPI
        </p>
        <div className="mt-2 flex overflow-hidden rounded-lg border border-ckb-line">
          <span className="flex-1 truncate px-4 py-3 text-[16px] text-ckb-muted">
            {upiId}
          </span>
          <button
            type="button"
            onClick={() => copy(upiId)}
            className="bg-ckb-blue px-6 text-[16px] font-semibold text-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-5 text-[15px] font-semibold text-ckb-blue">
          2. Enter 12-digit UTR after payment
        </p>
        <input
          value={utr.utr}
          onChange={(e) => utr.setUtr(e.target.value)}
          inputMode="numeric"
          placeholder="Enter UTR / Transaction ID"
          className="mt-2 h-12 w-full rounded-lg border border-ckb-line px-4 text-[16px] tracking-[0.06em] text-ckb-ink outline-none focus:border-ckb-blue"
        />
        <button
          type="button"
          onClick={utr.submit}
          disabled={!utr.valid}
          className="mt-3 h-12 w-full rounded-lg bg-ckb-blue text-[17px] font-bold text-white disabled:opacity-40"
        >
          Submit UTR
        </button>
      </section>
    </main>
  );
}
