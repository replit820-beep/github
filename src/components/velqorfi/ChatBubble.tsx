import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

// iOS Safari resizes/offsets the visual viewport when the address bar
// shows/hides or the page scrolls, which makes `position: fixed`
// elements appear to float/jitter. We track the visual viewport
// ourselves and pin the button with an inline transform so it stays
// glued to the bottom-right corner regardless of Safari's UI chrome.
function useStableFixedOffset() {
  const [offset, setOffset] = useState({ bottom: 0, right: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const bottom = window.innerHeight - (vv.height + vv.offsetTop);
      const right = window.innerWidth - (vv.width + vv.offsetLeft);
      setOffset({ bottom: Math.max(0, bottom), right: Math.max(0, right) });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return offset;
}

export function ChatBubble() {
  const { bottom, right } = useStableFixedOffset();

  return (
    <button
      type="button"
      aria-label="Support chat"
      className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ramp-primary shadow-card transition-transform hover:scale-105"
      style={{
        bottom: `calc(1.5rem + env(safe-area-inset-bottom) + ${bottom}px)`,
        right: `max(1.25rem, calc((100vw - 430px) / 2 + 1.25rem + ${right}px))`,
      }}
    >
      <MessageSquare className="h-6 w-6 text-brand-foreground" fill="currentColor" strokeWidth={1.5} />
    </button>
  );
}
