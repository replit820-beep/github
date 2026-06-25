import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="shell-mobile bg-background pb-24">
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
}
