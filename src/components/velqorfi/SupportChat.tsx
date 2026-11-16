import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Paperclip, SendHorizontal, Headset, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { BrandMark } from "@/components/velqorfi/BrandMark";
import {
  endSupport,
  lookupOrderStatus,
  pollSupport,
  resumeSupport,
  sendSupportMessage,
  sendSupportPhoto,
  startLiveSupport,
} from "@/lib/support.functions";
import { REPLIES, detectIntent, extractOrderId, statusLine } from "./support-bot";

type Msg = {
  id: string;
  from: "bot" | "user" | "agent" | "system";
  text: string;
  kind?: "summary" | "live";
  at: string;
  image?: string;
};
type Mode = "form" | "bot" | "waiting" | "active" | "closed";
type Profile = {
  name: string;
  email: string;
  businessType: string;
  issueType: string;
  description: string;
};

const ISSUE_TYPES = [
  "Product Instruction",
  "Account Issues",
  "KYC Issues",
  "Order Issues",
  "Fees Related",
  "Other General Inquiry",
];
const BUSINESS = ["On Ramp", "Off Ramp", "NFT Checkout", "Other"];
const STORE = "velqorfi-support-session";
const storeKey = (uid?: string) => (uid ? `${STORE}:${uid}` : STORE);
const INTRO: Msg = {
  id: "intro",
  from: "bot",
  at: new Date().toISOString(),
  text: "To ensure we provide you with the best possible service, please take a moment to complete the following information.",
};
const EMPTY_PROFILE: Profile = {
  name: "",
  email: "",
  businessType: "",
  issueType: "",
  description: "",
};
type Saved = {
  mode: Mode;
  step: number;
  profile: Profile;
  botMsgs: Msg[];
  session: { id: string; key: string } | null;
  awaitOrder: boolean;
};
const sessionArgs = (s: { id: string; key: string }) => ({ sessionId: s.id, key: s.key });

/** Shrink a picked photo to a JPEG data URL small enough to store and forward. */
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Could not read this image"));
      i.src = url;
    });
    let max = 1280;
    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL("image/jpeg", 0.72);
      if (out.length < 850_000) return out;
      max = Math.round(max * 0.7);
    }
    throw new Error("Image is too large");
  } finally {
    URL.revokeObjectURL(url);
  }
}
const WARN_MS = 5 * 60 * 1000;

const uid = () => Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** Tiny **bold** / *italic* renderer for bot text. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function SupportChat({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("form");
  const [step, setStep] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const userUid = user?.uid;
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [fieldError, setFieldError] = useState("");
  const [botMsgs, setBotMsgs] = useState<Msg[]>(() => [INTRO]);
  const [serverMsgs, setServerMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [awaitOrder, setAwaitOrder] = useState(false);
  const [session, setSession] = useState<{ id: string; key: string } | null>(null);
  const [agent, setAgent] = useState<{ name: string; photo: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [warned, setWarned] = useState(false);
  const lastUserAt = useRef(Date.now());
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const human = mode === "waiting" || mode === "active";

  const pushBot = useCallback((m: Omit<Msg, "id" | "at">) => {
    setBotMsgs((prev) => [...prev, { ...m, id: uid(), at: now() }]);
  }, []);

  // Restore the saved chat (signed-in users: kept until the chat is closed).
  useEffect(() => {
    if (authLoading || hydrated) return;
    const store = userUid ? localStorage : sessionStorage;
    const apply = (v: Saved) => {
      setProfile(v.profile);
      setBotMsgs(v.botMsgs.length ? v.botMsgs : [INTRO]);
      setStep(v.step);
      setAwaitOrder(v.awaitOrder);
      setSession(v.session);
      setMode(v.session ? (v.mode === "active" ? "active" : "waiting") : v.mode);
    };
    let restored = false;
    try {
      const raw = store.getItem(storeKey(userUid));
      if (raw) {
        const v = JSON.parse(raw) as Saved;
        if (v.mode !== "closed") {
          apply(v);
          restored = true;
        }
      }
    } catch {
      store.removeItem(storeKey(userUid));
    }
    if (restored || !user) {
      setHydrated(true);
      return;
    }
    // Nothing on this device — check for an open live chat on the account.
    void (async () => {
      try {
        const r = await resumeSupport({ data: { idToken: await user.getIdToken() } });
        if (r) {
          let msgs: Msg[] = [];
          try {
            msgs = JSON.parse(r.botTranscript || "[]") as Msg[];
          } catch {
            msgs = [];
          }
          apply({
            mode: "waiting",
            step: 4,
            profile: r.profile,
            botMsgs: msgs,
            session: { id: r.id, key: r.key },
            awaitOrder: false,
          });
        }
      } catch {
        /* start fresh */
      } finally {
        setHydrated(true);
      }
    })();
  }, [authLoading, hydrated, userUid, user]);

  // Save progress so reopening continues the same chat.
  useEffect(() => {
    if (!hydrated) return;
    const store = userUid ? localStorage : sessionStorage;
    if (mode === "closed") {
      store.removeItem(storeKey(userUid));
      return;
    }
    const v: Saved = { mode, step, profile, botMsgs, session, awaitOrder };
    try {
      store.setItem(storeKey(userUid), JSON.stringify(v));
    } catch {
      /* storage full — ignore */
    }
  }, [hydrated, userUid, mode, step, profile, botMsgs, session, awaitOrder]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [botMsgs, serverMsgs, pending, typing, mode, step]);

  useEffect(() => {
    if (mode !== "form") inputRef.current?.focus();
  }, [mode]);

  // Poll the live chat.
  useEffect(() => {
    if (!session || !human) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await pollSupport({ data: sessionArgs(session) });
        if (stop) return;
        const msgs: Msg[] = r.messages.map((m) => ({
          id: m.id,
          from: m.from as Msg["from"],
          text: m.text,
          at: m.at,
          ...(m.image ? { image: m.image } : {}),
        }));
        setServerMsgs(msgs);
        setPending((p) =>
          p.filter(
            (pm) =>
              !msgs.some(
                (m) =>
                  m.from === "user" && m.text === pm.text && (m.image ?? "") === (pm.image ?? ""),
              ),
          ),
        );
        if (r.lastUserAt)
          lastUserAt.current = Math.max(lastUserAt.current, Date.parse(r.lastUserAt));
        if (r.status === "active" && r.agentName) {
          setAgent({ name: r.agentName, photo: r.agentPhoto });
          setMode("active");
        }
        if (r.status === "closed") setMode("closed");
      } catch (e) {
        if (!stop && e instanceof Error && /not found/i.test(e.message)) setMode("closed");
      }
    };
    void tick();
    const t = setInterval(tick, 3000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [session, human]);

  // 5-minute inactivity warning (server closes the chat at 10 minutes).
  useEffect(() => {
    if (!human) return;
    const t = setInterval(() => {
      if (!warned && Date.now() - lastUserAt.current > WARN_MS) {
        setWarned(true);
        setPending((p) => [
          ...p,
          {
            id: uid(),
            from: "system",
            at: now(),
            text: "⚠️ You've been inactive for 5 minutes. This chat will close automatically in 5 minutes if there's no reply.",
          },
        ]);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [human, warned]);

  /* ---------------- intake form ---------------- */
  const fields: Array<{
    key: keyof Profile;
    label: string;
    type: "text" | "email" | "select" | "textarea";
    options?: string[];
  }> = [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "businessType", label: "Business Type", type: "select", options: BUSINESS },
    { key: "issueType", label: "Issue Type", type: "select", options: ISSUE_TYPES },
    { key: "description", label: "Issue Description", type: "textarea" },
  ];

  const nextStep = () => {
    const f = fields[step]!;
    const v = profile[f.key].trim();
    if (!v) return setFieldError(`Please enter ${f.label.toLowerCase()}`);
    if (f.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return setFieldError("Please enter a valid email");
    setFieldError("");
    if (step < fields.length - 1) return setStep(step + 1);
    setBotMsgs((prev) => [
      ...prev,
      { id: uid(), from: "bot", kind: "summary", text: "", at: now() },
    ]);
    setMode("bot");
    respond(profile.description, true);
  };

  /* ---------------- bot brain ---------------- */
  const transcript = () =>
    botMsgs
      .filter((m) => !m.kind && m.id !== "intro")
      .map((m) => `${m.from === "user" ? "User" : "Bot"}: ${m.text.replace(/\*/g, "")}`)
      .join("\n");

  const respond = async (text: string, fromForm = false) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, 700));
    const orderId = extractOrderId(text);
    const intent = detectIntent(text);
    try {
      if (intent === "live") {
        pushBot({
          from: "bot",
          text: "Sure — I can connect you with one of our support specialists. Tap the button below to start a live chat.",
        });
        pushBot({ from: "bot", kind: "live", text: "" });
      } else if (
        orderId &&
        (awaitOrder || intent === "order" || intent === "refund" || intent === "payment")
      ) {
        setAwaitOrder(false);
        const r = await lookupOrderStatus({ data: { orderId } });
        if (!r.found) {
          setAwaitOrder(true);
          pushBot({
            from: "bot",
            text: `I couldn't find an order with ID **${orderId}**. Please double-check the Order ID from your order history and send it again.`,
          });
        } else {
          pushBot({
            from: "bot",
            text: `Here are the details for order **${r.id}**:\n\n${r.receive} ${r.asset} for ${r.amount.toLocaleString("en-IN")} ${r.fiat}\nStatus: ${statusLine(r.status, r.utrSubmitted)}\n\nIs there anything else I can help you with? Type *live support* to talk to an agent.`,
          });
        }
      } else if (awaitOrder && /^\s*\d+\s*$/.test(text)) {
        pushBot({
          from: "bot",
          text: "That doesn't look like a valid Order ID. It is a 13–16 digit number shown in your order history. Please try again.",
        });
      } else if (intent === "order" || (fromForm && profile.issueType === "Order Issues")) {
        setAwaitOrder(true);
        pushBot({
          from: "bot",
          text: "I'm sorry for the inconvenience. I'll check that for you right away — please share your **Order ID** (you can find it in your order history).",
        });
      } else if (intent === "refund") {
        setAwaitOrder(true);
        pushBot({ from: "bot", text: REPLIES.refund });
      } else if (fromForm) {
        pushBot({
          from: "bot",
          text: `Thanks ${profile.name.split(" ")[0]}! I've noted your ${profile.issueType.toLowerCase()} query. ${intent === "unknown" ? "Could you tell me a bit more, or share your **Order ID** if it's about an order?" : REPLIES[intent as keyof typeof REPLIES]}`,
        });
      } else {
        pushBot({ from: "bot", text: REPLIES[intent as keyof typeof REPLIES] });
      }
    } catch {
      pushBot({
        from: "bot",
        text: "Sorry, I couldn't fetch that right now. Please try again in a moment, or type *live support*.",
      });
    } finally {
      setTyping(false);
    }
  };

  const connectLive = async () => {
    if (connecting || human) return;
    setConnecting(true);
    try {
      const idToken = user ? await user.getIdToken().catch(() => undefined) : undefined;
      const r = await startLiveSupport({
        data: {
          ...profile,
          transcript: transcript(),
          botTranscript: JSON.stringify(botMsgs),
          ...(idToken ? { idToken } : {}),
        },
      });
      setSession(r);
      lastUserAt.current = Date.now();
      setWarned(false);
      setMode("waiting");
    } catch (e) {
      pushBot({
        from: "bot",
        text:
          e instanceof Error && e.message.includes("not available")
            ? e.message
            : "Sorry, live support couldn't be reached right now. Please try again shortly.",
      });
    } finally {
      setConnecting(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || mode === "form" || mode === "closed") return;
    setInput("");
    if (human && session) {
      lastUserAt.current = Date.now();
      setWarned(false);
      const m: Msg = { id: uid(), from: "user", text, at: now() };
      setPending((p) => [...p, m]);
      try {
        await sendSupportMessage({ data: { ...sessionArgs(session), text } });
      } catch (e) {
        setPending((p) => [
          ...p.filter((x) => x.id !== m.id),
          {
            id: uid(),
            from: "system",
            at: now(),
            text: e instanceof Error ? e.message : "Message not sent",
          },
        ]);
      }
      return;
    }
    setBotMsgs((p) => [...p, { id: uid(), from: "user", text, at: now() }]);
    void respond(text);
  };

  const endChat = async () => {
    if (session && human) {
      try {
        await endSupport({ data: sessionArgs(session) });
      } catch {
        /* already closed */
      }
    }
    setMode("closed");
  };

  const restart = () => {
    setSession(null);
    setAgent(null);
    setServerMsgs([]);
    setPending([]);
    setAwaitOrder(false);
    setWarned(false);
    setStep(0);
    setFieldError("");
    setProfile((p) => ({ ...EMPTY_PROFILE, name: p.name, email: p.email }));
    setBotMsgs([{ ...INTRO, at: now() }]);
    setMode("form");
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const attachPhoto = async (file: File | undefined) => {
    if (!file || mode === "form" || mode === "closed") return;
    if (!file.type.startsWith("image/")) {
      setPending((p) => [
        ...p,
        { id: uid(), from: "system", at: now(), text: "Please choose a photo (JPG, PNG or WEBP)." },
      ]);
      return;
    }
    setUploading(true);
    try {
      const image = await compressImage(file);
      const caption = input.trim();
      setInput("");
      if (human && session) {
        lastUserAt.current = Date.now();
        setWarned(false);
        const m: Msg = { id: uid(), from: "user", text: caption, image, at: now() };
        setPending((p) => [...p, m]);
        try {
          await sendSupportPhoto({ data: { ...sessionArgs(session), image, caption } });
        } catch (e) {
          setPending((p) => [
            ...p.filter((x) => x.id !== m.id),
            {
              id: uid(),
              from: "system",
              at: now(),
              text: e instanceof Error ? e.message : "Photo not sent",
            },
          ]);
        }
      } else {
        setBotMsgs((p) => [
          ...p,
          { id: uid(), from: "user", text: caption, image, at: now() },
          {
            id: uid(),
            from: "bot",
            at: now(),
            text: "Thanks for the screenshot. Our support specialists can review it for you — tap the button below to share it with a live agent.",
          },
          { id: uid(), from: "bot", kind: "live", text: "", at: now() },
        ]);
      }
    } catch (e) {
      setPending((p) => [
        ...p,
        {
          id: uid(),
          from: "system",
          at: now(),
          text: e instanceof Error ? e.message : "Could not attach photo",
        },
      ]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const headerName = mode === "active" && agent ? agent.name : "Velqorfi Support";
  const all = [...botMsgs, ...serverMsgs, ...pending];

  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-ink/40 animate-rise">
      <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-ramp-primary">
        <header className="flex items-center gap-3 px-5 pb-5 pt-[calc(1rem+env(safe-area-inset-top))] text-brand-foreground">
          {mode === "active" && agent ? (
            <img
              src={agent.photo}
              alt={agent.name}
              className="h-10 w-10 rounded-full border-2 border-brand-foreground/60 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-foreground/15">
              <BrandMark className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-semibold leading-tight">{headerName}</p>
            <p className="text-[12px] opacity-80">
              {mode === "active"
                ? "● Online · Support specialist"
                : mode === "waiting"
                  ? "Connecting to an agent…"
                  : "Typically replies instantly"}
            </p>
          </div>
          {human && (
            <button
              onClick={endChat}
              className="rounded-full bg-brand-foreground/15 px-3 py-1.5 text-[12px] font-semibold"
            >
              End chat
            </button>
          )}
          <button aria-label="Close support" onClick={onClose} className="p-1">
            <ChevronDown className="h-6 w-6" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-background">
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-5">
            <p className="text-center text-[13px] text-ink-soft">
              {timeLabel(botMsgs[0]?.at ?? now())}
            </p>

            {all.map((m, i) => {
              const prev = all[i - 1];
              const showName = !prev || prev.from !== m.from;
              if (m.kind === "summary") return <SummaryCard key={m.id} p={profile} />;
              if (m.kind === "live")
                return (
                  <div key={m.id} className="pl-11">
                    <button
                      onClick={connectLive}
                      disabled={connecting || human || mode === "closed"}
                      className="flex items-center gap-2 rounded-full bg-success px-5 py-2.5 text-[14px] font-semibold text-brand-foreground shadow-card disabled:opacity-50"
                    >
                      {connecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Headset className="h-4 w-4" />
                      )}
                      {human ? "Live support requested" : "Talk to live support"}
                    </button>
                  </div>
                );
              if (m.from === "system")
                return (
                  <p
                    key={m.id}
                    className="mx-auto max-w-[90%] rounded-xl bg-notice px-3 py-2 text-center text-[12px] text-notice-foreground"
                  >
                    {m.text}
                  </p>
                );
              if (m.from === "user")
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[78%] overflow-hidden rounded-2xl rounded-br-md bg-ramp-primary text-[15px] text-brand-foreground">
                      {m.image && (
                        <a href={m.image} target="_blank" rel="noreferrer">
                          <img
                            src={m.image}
                            alt="Attached photo"
                            className="max-h-64 w-full object-cover"
                          />
                        </a>
                      )}
                      {m.text && <p className="whitespace-pre-wrap px-4 py-2.5">{m.text}</p>}
                    </div>
                  </div>
                );
              const isAgent = m.from === "agent";
              return (
                <div key={m.id}>
                  {showName && (
                    <p className="mb-1 pl-11 text-[13px] text-ink-soft">
                      {isAgent ? (agent?.name ?? "Support") : "Velqorfi Support"}
                    </p>
                  )}
                  <div className="flex items-end gap-2">
                    <span className="w-9 shrink-0">
                      {showName || all[i + 1]?.from !== m.from ? (
                        isAgent && agent ? (
                          <img
                            src={agent.photo}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <BrandMark className="h-8 w-8 text-ramp-primary" />
                        )
                      ) : null}
                    </span>
                    <p className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-surface-soft px-4 py-2.5 text-[15px] leading-snug text-ink">
                      <RichText text={m.text} />
                    </p>
                  </div>
                </div>
              );
            })}

            {mode === "form" && (
              <FormCard
                field={fields[step]!}
                value={profile[fields[step]!.key]}
                onChange={(v) => setProfile((p) => ({ ...p, [fields[step]!.key]: v }))}
                step={step}
                total={fields.length}
                error={fieldError}
                onNext={nextStep}
                onBack={step > 0 ? () => setStep(step - 1) : undefined}
              />
            )}

            {typing && <Typing />}
            {mode === "waiting" && (
              <div className="mx-auto flex max-w-[92%] items-center gap-3 rounded-2xl border border-ramp-line bg-card px-4 py-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-ramp-primary" />
                <p className="text-[13px] text-ink">
                  Please wait — we're connecting you to the next available support agent. Please
                  don't close this window.
                </p>
              </div>
            )}
            {mode === "active" && agent && serverMsgs.length === 0 && (
              <p className="text-center text-[12px] text-ink-soft">{agent.name} joined the chat</p>
            )}
            {mode === "closed" && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-[13px] text-ink-soft">This chat has ended.</p>
                <button
                  onClick={restart}
                  className="rounded-full bg-ramp-primary px-5 py-2 text-[13px] font-semibold text-brand-foreground"
                >
                  Start new chat
                </button>
              </div>
            )}
          </div>

          {mode !== "form" && mode !== "closed" && (
            <div className="px-4 pb-2">
              <div className="flex items-end gap-2 rounded-[26px] border border-ink/60 px-4 py-2.5 focus-within:border-ramp-primary">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void attachPhoto(e.target.files?.[0])}
                />
                <button
                  type="button"
                  aria-label="Attach photo"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mb-1 shrink-0 text-ink disabled:opacity-40"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={
                    mode === "waiting" ? "Type a message for the agent…" : "Type a message"
                  }
                  className="max-h-28 flex-1 resize-none bg-transparent py-1 text-[16px] text-ink outline-none placeholder:text-ink-soft"
                />
                <button
                  aria-label="Send"
                  onClick={() => void send()}
                  disabled={!input.trim()}
                  className="mb-0.5 text-ramp-primary disabled:opacity-30"
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          <p className="flex items-center justify-center gap-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 text-[12px] text-ink-soft">
            <BrandMark className="h-3.5 w-3.5" /> Secured by Velqorfi
          </p>
        </div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-end gap-2">
      <BrandMark className="h-8 w-8 text-ramp-primary" />
      <span className="flex gap-1 rounded-2xl bg-surface-soft px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-ink-soft"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

function SummaryCard({ p }: { p: Profile }) {
  const rows: Array<[string, string]> = [
    ["Name", p.name],
    ["Email", p.email],
    ["Business Type", p.businessType],
    ["Issue Type", p.issueType],
    ["Issue Description", p.description],
  ];
  return (
    <div className="flex items-end gap-2">
      <BrandMark className="h-8 w-8 shrink-0 text-ramp-primary" />
      <div className="flex-1 space-y-4 rounded-3xl border border-ramp-line bg-card px-5 py-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-[15px] font-bold text-ink">{k}</p>
            <p className="break-words text-[15px] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormCard(props: {
  field: { key: string; label: string; type: string; options?: string[] };
  value: string;
  onChange: (v: string) => void;
  step: number;
  total: number;
  error: string;
  onNext: () => void;
  onBack?: (() => void) | undefined;
}) {
  const { field, value, onChange } = props;
  const cls =
    "w-full rounded-full border-2 border-ramp-line bg-card px-5 py-3 text-[16px] text-ink outline-none focus:border-success";
  return (
    <div className="flex items-end gap-2">
      <BrandMark className="h-8 w-8 shrink-0 text-ramp-primary" />
      <form
        className="flex-1 rounded-3xl border border-ramp-line bg-card px-5 py-5"
        onSubmit={(e) => {
          e.preventDefault();
          props.onNext();
        }}
      >
        <label className="mb-3 block text-[16px] font-bold text-ink" htmlFor={`f-${field.key}`}>
          {field.label}
        </label>
        {field.type === "select" ? (
          <select
            id={`f-${field.key}`}
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cls}
          >
            <option value="" disabled>
              Select…
            </option>
            {field.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            id={`f-${field.key}`}
            autoFocus
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${cls} rounded-2xl`}
            maxLength={1000}
          />
        ) : (
          <input
            id={`f-${field.key}`}
            autoFocus
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cls}
            maxLength={120}
          />
        )}
        {props.error && <p className="mt-2 text-[12px] text-danger">{props.error}</p>}
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-3 text-[15px] text-ink-soft">
            {props.onBack && (
              <button type="button" aria-label="Back" onClick={props.onBack}>
                <X className="h-4 w-4" />
              </button>
            )}
            {props.step + 1} of {props.total}
          </span>
          <button
            type="submit"
            className="rounded-full bg-success px-6 py-3 text-[16px] font-semibold text-brand-foreground"
          >
            {props.step + 1 === props.total ? "Submit" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
