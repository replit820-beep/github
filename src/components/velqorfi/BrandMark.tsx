export function BrandMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16 1.5c3.6 3.4 5.6 8 5.6 12.8 0 2.2-.4 4.2-1.1 6L16 24l-4.5-3.7a16 16 0 0 1-1.1-6c0-4.8 2-9.4 5.6-12.8Z" />
      <path d="M9.4 20.4 5.6 26c-.4.6.2 1.3.9 1.1l4.9-1.6a15 15 0 0 1-2-5.1Zm13.2 0 3.8 5.6c.4.6-.2 1.3-.9 1.1l-4.9-1.6a15 15 0 0 0 2-5.1Z" opacity=".7" />
    </svg>
  );
}