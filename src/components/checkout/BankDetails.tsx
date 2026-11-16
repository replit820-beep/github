import { useState } from "react";
import { Check, Copy } from "lucide-react";

export type BankInfo = {
  bankName: string;
  holderName: string;
  accountNumber: string;
  ifsc: string;
};

export function BankDetails({ bank, theme }: { bank: BankInfo; theme: "blue" | "teal" }) {
  const [copied, setCopied] = useState("");
  const accent = theme === "blue" ? "text-ckb-blue" : "text-ckt-teal";
  const line = theme === "blue" ? "border-ckb-line" : "border-ckt-line";
  const ink = theme === "blue" ? "text-ckb-ink" : "text-ckt-ink";
  const muted = theme === "blue" ? "text-ckb-muted" : "text-ckt-muted";

  const rows = [
    { label: "Bank Name", value: bank.bankName },
    { label: "Account Holder", value: bank.holderName },
    { label: "Account Number", value: bank.accountNumber },
    { label: "IFSC Code", value: bank.ifsc },
  ];

  function copy(label: string, value: string) {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div>
      <h2 className={`font-payment text-[19px] font-bold tracking-normal ${ink}`}>
        Pay via IMPS bank transfer
      </h2>
      <p className={`mt-1 text-[14px] ${muted}`}>
        Transfer the exact amount to the account below.
      </p>
      <div className={`mt-4 divide-y rounded-lg border ${line}`}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] ${muted}`}>{row.label}</p>
              <p className={`truncate text-[16px] font-semibold ${ink}`}>{row.value || "—"}</p>
            </div>
            <button
              type="button"
              aria-label={`Copy ${row.label}`}
              onClick={() => copy(row.label, row.value)}
              className={accent}
            >
              {copied === row.label ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
