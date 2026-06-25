import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing in · Velqorfi" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Securing your session...");

  useEffect(() => {
    let cancelled = false;

    const finishSignIn = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = getSafeNextPath(url.searchParams.get("next"));

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) throw error ?? new Error("Session was not created");

        window.history.replaceState({}, document.title, next);
        window.location.replace(next);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setMessage("Sign-in could not be completed. Please try again.");
        window.setTimeout(() => navigate({ to: "/auth", replace: true }), 1200);
      }
    };

    void finishSignIn();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="shell-mobile flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <h1 className="mt-5 text-xl font-bold">Signing you in</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/app/dashboard";
  return next;
}