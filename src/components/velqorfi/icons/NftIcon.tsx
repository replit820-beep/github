export function NftIcon() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <defs><linearGradient id="nftBadge" x1="8" y1="6" x2="37" y2="39"><stop stopColor="#79A5F5"/><stop offset="1" stopColor="#2F5FE0"/></linearGradient></defs>
      <rect x="4" y="3" width="31" height="31" rx="9" fill="#3569DF" opacity=".28"/><rect x="9" y="8" width="31" height="31" rx="9" fill="url(#nftBadge)"/>
      <rect x="16" y="16" width="17" height="16" rx="2.5" fill="none" stroke="white" strokeWidth="1.7"/><circle cx="28.5" cy="20.5" r="1.5" fill="white"/><path d="m18.5 29 4.2-4.6 2.8 2.7 2-2 3.5 3.9" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}