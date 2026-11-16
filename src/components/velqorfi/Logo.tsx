export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const text = tone === "light" ? "text-white" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <rect width="28" height="28" rx="8" className="fill-brand" />
        <path
          d="M8 9.5h3.4l2.6 7 2.6-7H20l-4.6 11.2h-2.8L8 9.5Z"
          className="fill-brand-foreground"
        />
      </svg>
      <span
        className={`font-display text-[18px] font-extrabold tracking-[-0.03em] ${text}`}
      >
        Velqorfi
      </span>
    </span>
  );
}
