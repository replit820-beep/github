export function PaymentIcon() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <defs><linearGradient id="paymentBadge" x1="8" y1="6" x2="37" y2="39"><stop stopColor="#79A5F5"/><stop offset="1" stopColor="#2F5FE0"/></linearGradient></defs>
      <rect x="4" y="3" width="31" height="31" rx="9" fill="#3569DF" opacity=".28"/><rect x="9" y="8" width="31" height="31" rx="9" fill="url(#paymentBadge)"/>
      <circle cx="27.5" cy="20" r="4.5" fill="none" stroke="white" strokeWidth="1.7"/><path d="M27.5 17.8v4.4m-1.5-3.4h2.2c1.5 0 1.5 2.2 0 2.2H26m-9 5 3.3-2.1c1-.6 2.2-.4 2.9.5l.4.6 4.7-.7c2-.3 2.7 2 .9 2.8l-7.1 3.1c-.8.4-1.8.3-2.6-.1L17 28.8" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}