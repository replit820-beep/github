export function CardIcon() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <defs><linearGradient id="cardBadge" x1="8" y1="6" x2="37" y2="39"><stop stopColor="#79A5F5"/><stop offset="1" stopColor="#2F5FE0"/></linearGradient></defs>
      <rect x="4" y="3" width="31" height="31" rx="9" fill="#3569DF" opacity=".28"/><rect x="9" y="8" width="31" height="31" rx="9" fill="url(#cardBadge)"/>
      <rect x="16" y="18" width="17" height="13" rx="2.5" fill="none" stroke="white" strokeWidth="1.7"/><path d="M16 22h17M20 27h4" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}