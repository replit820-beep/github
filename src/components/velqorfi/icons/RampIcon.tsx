export function RampIcon() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <defs><linearGradient id="rampBadge" x1="8" y1="6" x2="37" y2="39"><stop stopColor="#79A5F5"/><stop offset="1" stopColor="#2F5FE0"/></linearGradient></defs>
      <rect x="4" y="3" width="31" height="31" rx="9" fill="#3569DF" opacity=".28"/>
      <rect x="9" y="8" width="31" height="31" rx="9" fill="url(#rampBadge)"/>
      <path d="M17 21h15l-1 11H18l-1-11Zm4-1c0-2.2 1.4-4 3.5-4s3.5 1.8 3.5 4M20 25h8m-2-2 2 2-2 2" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}