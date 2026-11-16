import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  FileText,
  Globe,
  Home,
  LogIn,
  LogOut,
  ShieldCheck,
  Repeat,
  X,
} from "lucide-react";
import { BrandMark } from "./BrandMark";
import { PaymentMarks } from "./PaymentMarks";
import { useAuth } from "@/hooks/use-auth";

export function RampMenu({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { icon: Home, label: "Home", to: "/ramp" as const },
    { icon: BarChart3, label: "Stocks Holdings", to: "/ramp" as const },
    { icon: Repeat, label: "Transactions", to: "/history" as const },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-[430px] animate-in slide-in-from-top rounded-b-2xl bg-white pb-6 duration-300 ease-out">
        <div className="flex items-center justify-between px-5 pt-6">
           <p className="text-[22px] font-bold text-ink">Menu</p>
          <button onClick={onClose} aria-label="Close menu">
            <X className="h-6 w-6 text-ink" />
          </button>
        </div>

        <div className="mt-6 space-y-4 px-5">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              onClick={onClose}
               className="flex w-full items-center gap-4 rounded-lg border border-ramp-line px-4 py-3.5 text-left transition-colors hover:bg-ramp-primary-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <c.icon className="h-5 w-5 text-brand" />
              </span>
               <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-ink">
                {c.label}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
            </Link>
          ))}

          <button
            onClick={async () => {
              if (user) {
                await signOut();
                onClose();
                navigate({ to: "/ramp" });
              } else {
                onClose();
                navigate({ to: "/login", search: { redirect: "/ramp" } });
              }
            }}
            className="flex w-full items-center gap-4 rounded-lg border border-ramp-line px-4 py-3.5 text-left transition-colors hover:bg-ramp-primary-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10">
              {user ? (
                <LogOut className="h-5 w-5 text-brand" />
              ) : (
                <LogIn className="h-5 w-5 text-brand" />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-[16px] font-semibold text-ink">
              {user ? "Sign out" : "Sign in"}
              {user && (
                <span className="block truncate text-[12px] font-normal text-ink-soft">
                  {user.email}
                </span>
              )}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
          </button>
        </div>

        <div className="mt-7">
          <div className="flex items-center gap-3 bg-surface-soft px-5 py-4">
            <Globe className="h-5 w-5 shrink-0 text-ink" />
            <span className="min-w-0 flex-1 text-[17px] text-ink">Language</span>
            <span className="shrink-0 text-[15px] text-ink-soft">
              English(US)
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <FileText className="h-5 w-5 shrink-0 text-ink" />
            <span className="min-w-0 flex-1 text-[17px] text-ink">
              Terms of Service
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ink" />
            <span className="min-w-0 flex-1 text-[17px] text-ink">
              Privacy Policy
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <PaymentMarks />
          <p className="flex items-center gap-1.5 text-[14px] text-ink-soft">
            Powered by
            <Link to="/" className="inline-flex items-center gap-1 font-semibold text-brand">
              <BrandMark />
              Velqorfi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
