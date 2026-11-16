export function TokenIcon() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <defs><linearGradient id="tokenBadge" x1="8" y1="6" x2="37" y2="39"><stop stopColor="#79A5F5"/><stop offset="1" stopColor="#2F5FE0"/></linearGradient></defs>
      <rect x="4" y="3" width="31" height="31" rx="9" fill="#3569DF" opacity=".28"/><rect x="9" y="8" width="31" height="31" rx="9" fill="url(#tokenBadge)"/>
      <ellipse cx="24" cy="20" rx="7" ry="3" fill="none" stroke="white" strokeWidth="1.7"/><path d="M17 20v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M17 25v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" fill="none" stroke="white" strokeWidth="1.7"/>
    </svg>
  );
}