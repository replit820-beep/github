export function PaytmMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 34" className={className} role="img" aria-label="Paytm">
      <text
        x="0"
        y="25"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="#012970"
      >
        Pay
      </text>
      <text
        x="45"
        y="25"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="#00BAF2"
      >
        tm
      </text>
    </svg>
  );
}

export function PhonePeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="PhonePe">
      <circle cx="20" cy="20" r="20" fill="#5F259F" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="17"
        fontWeight="700"
        fill="#ffffff"
      >
        पे
      </text>
    </svg>
  );
}
