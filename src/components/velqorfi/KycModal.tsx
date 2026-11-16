import { useEffect, useRef, useState } from "react";
import { Camera, Check, ShieldCheck, Upload, X } from "lucide-react";
import { submitKyc } from "@/lib/kyc.functions";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];
// country name -> zippopotam code
const COUNTRIES: Record<string, string> = {
  India: "in", "United States": "us", "United Kingdom": "gb", Canada: "ca", Australia: "au",
  Germany: "de", France: "fr", Spain: "es", Italy: "it", Netherlands: "nl", Japan: "jp",
  "New Zealand": "nz", "South Africa": "za", Brazil: "br", Mexico: "mx", Turkey: "tr",
  Pakistan: "pk", "Sri Lanka": "lk", Bangladesh: "bd", Nepal: "np", Singapore: "sg",
  "United Arab Emirates": "ae", "Saudi Arabia": "sa", Other: "",
};

function compress(src: string | Blob, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    im.onerror = () => reject(new Error("Could not read image"));
    im.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

function CameraBox({
  facing, auto, onShot, onClose,
}: { facing: "user" | "environment"; auto?: boolean; onShot: (d: string) => void; onClose: () => void }) {
  const v = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const [hint, setHint] = useState(auto ? "Look at the camera…" : "");
  const shoot = () => {
    const el = v.current;
    if (!el || !el.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = el.videoWidth; c.height = el.videoHeight;
    c.getContext("2d")!.drawImage(el, 0, 0);
    compress(c.toDataURL("image/jpeg", 0.9)).then(onShot);
  };
  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const fire = () => { if (!done) { done = true; shoot(); } };
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing } })
      .then(async (s) => {
        stream = s;
        if (v.current) { v.current.srcObject = s; await v.current.play().catch(() => {}); }
        if (!auto) return;
        const FD = (window as unknown as { FaceDetector?: new () => { detect: (e: HTMLVideoElement) => Promise<unknown[]> } }).FaceDetector;
        if (FD) {
          const det = new FD();
          timer = setInterval(async () => {
            try { if (v.current && (await det.detect(v.current)).length) { setHint("Face found"); fire(); } } catch { /* ignore */ }
          }, 500);
        } else {
          // Browser can't detect faces: auto-capture after a short countdown.
          setHint("Hold still, capturing in 3s…");
          fallback = setTimeout(fire, 3000);
        }
      })
      .catch(() => setErr("Camera permission denied. Please allow camera access."));
    return () => { clearInterval(timer); clearTimeout(fallback); stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-foreground/90 p-4">
      {err ? <p className="text-sm text-background">{err}</p> : (
        <video ref={v} playsInline muted className={`max-h-[70vh] w-full max-w-md rounded-2xl ${facing === "user" ? "-scale-x-100" : ""}`} />
      )}
      {hint && <p className="text-sm text-background">{hint}</p>}
      <div className="flex gap-3">
        {!err && <button onClick={shoot} className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground">Capture</button>}
        <button onClick={onClose} className="rounded-xl bg-background px-5 py-2 text-sm font-semibold text-foreground">Cancel</button>
      </div>
    </div>
  );
}

function DocPick({ label, value, onChange }: { label: string; value: string; onChange: (d: string) => void }) {
  const [cam, setCam] = useState(false);
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="mb-2 text-[13px] font-semibold text-foreground">{label}</p>
      {value && <img src={value} alt={label} className="mb-2 h-28 w-full rounded-xl object-cover" />}
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-muted py-2 text-[12px] font-medium text-foreground">
          <Upload className="h-4 w-4" /> Upload
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) compress(f).then(onChange); }} />
        </label>
        <button type="button" onClick={() => setCam(true)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-muted py-2 text-[12px] font-medium text-foreground">
          <Camera className="h-4 w-4" /> Scan
        </button>
      </div>
      {cam && <CameraBox facing="environment" onShot={(d) => { onChange(d); setCam(false); }} onClose={() => setCam(false)} />}
    </div>
  );
}

const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-brand";

export function KycModal({ getToken, onClose, onDone }: { getToken: () => Promise<string>; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", age: "", country: "India", state: "", region: "", pincode: "", address: "" });
  const [pinMsg, setPinMsg] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [selfie, setSelfie] = useState("");
  const [selfieCam, setSelfieCam] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f, val: string) => setF((p) => ({ ...p, [k]: val }));
  const isIndia = f.country === "India";

  useEffect(() => {
    const pin = f.pincode.trim();
    const code = COUNTRIES[f.country];
    if (!code || (isIndia ? !/^\d{6}$/.test(pin) : pin.length < 3)) { setPinMsg(""); return; }
    const ctrl = new AbortController();
    setPinMsg("Looking up pincode…");
    const url = isIndia ? `https://api.postalpincode.in/pincode/${pin}` : `https://api.zippopotam.us/${code}/${encodeURIComponent(pin)}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (isIndia) {
          const po = j?.[0]?.PostOffice?.[0];
          if (!po) throw new Error();
          setF((p) => ({ ...p, state: INDIA_STATES.find((s) => s.toLowerCase() === String(po.State).toLowerCase()) ?? po.State, region: po.District, address: p.address || `${po.Name}, ${po.District}, ${po.State} - ${pin}` }));
        } else {
          const pl = j?.places?.[0];
          if (!pl) throw new Error();
          setF((p) => ({ ...p, state: pl.state, region: pl["place name"], address: p.address || `${pl["place name"]}, ${pl.state} - ${pin}` }));
        }
        setPinMsg("Address filled from pincode");
      })
      .catch((e) => { if (e?.name !== "AbortError") setPinMsg("Pincode not found, please fill manually"); });
    return () => ctrl.abort();
  }, [f.pincode, f.country, isIndia]);

  const basicOk = f.name.trim().length >= 2 && Number(f.age) >= 18 && f.state && f.region && f.pincode && f.address.trim().length >= 5;

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await submitKyc({ data: { idToken: await getToken(), ...f, age: Number(f.age), aadhaar, pan, selfie, consent: true } });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "KYC failed, try again");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 shadow-card sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">KYC Verification {step > 0 && <span className="text-muted-foreground">· Step {step}/3</span>}</h2>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {step === 0 && (
          <div className="text-center">
            <ShieldCheck className="mx-auto h-14 w-14 text-brand" />
            <p className="mt-3 text-[14px] font-semibold text-foreground">Complete KYC to continue</p>
            <p className="mt-1 text-[12px] text-muted-foreground">One-time verification. You'll need basic details, Aadhaar, PAN and a selfie. Takes about 2 minutes.</p>
            <button onClick={() => setStep(1)} className="mt-5 w-full rounded-2xl bg-buy-gradient py-3.5 text-[14px] font-semibold text-brand-foreground">Start KYC</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <input className={input} placeholder="Full name (as on Aadhaar)" value={f.name} onChange={(e) => set("name", e.target.value)} />
            <input className={input} placeholder="Age" inputMode="numeric" value={f.age} onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))} />
            {f.age && Number(f.age) < 18 && <p className="text-[11px] text-danger">You must be 18 or older.</p>}
            <select className={input} value={f.country} onChange={(e) => setF((p) => ({ ...p, country: e.target.value, state: "", region: "", pincode: "" }))}>
              {Object.keys(COUNTRIES).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className={input} placeholder={isIndia ? "Pincode (6 digits)" : "Postal / ZIP code"} value={f.pincode}
              onChange={(e) => set("pincode", isIndia ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 12))} />
            {pinMsg && <p className="text-[11px] text-muted-foreground">{pinMsg}</p>}
            {isIndia ? (
              <select className={input} value={f.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">Select state</option>
                {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <input className={input} placeholder="State / Province" value={f.state} onChange={(e) => set("state", e.target.value)} />
            )}
            <input className={input} placeholder={isIndia ? "District / City" : "City / Region"} value={f.region} onChange={(e) => set("region", e.target.value)} />
            <textarea className={input} rows={2} placeholder="Full address" value={f.address} onChange={(e) => set("address", e.target.value)} />
            <button disabled={!basicOk} onClick={() => setStep(2)} className="w-full rounded-2xl bg-buy-gradient py-3.5 text-[14px] font-semibold text-brand-foreground disabled:opacity-50">Proceed</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <DocPick label="Aadhaar card" value={aadhaar} onChange={setAadhaar} />
            <DocPick label="PAN card" value={pan} onChange={setPan} />
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-muted py-3.5 text-[14px] font-semibold text-foreground">Back</button>
              <button disabled={!aadhaar || !pan} onClick={() => setStep(3)} className="flex-1 rounded-2xl bg-buy-gradient py-3.5 text-[14px] font-semibold text-brand-foreground disabled:opacity-50">Proceed</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">Take a clear selfie. It captures automatically when your face is in front of the camera.</p>
            {selfie ? <img src={selfie} alt="Selfie" className="mx-auto h-48 w-48 rounded-full object-cover" /> : (
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-muted"><Camera className="h-10 w-10 text-muted-foreground" /></div>
            )}
            <button onClick={() => setSelfieCam(true)} className="w-full rounded-2xl bg-muted py-3 text-[13px] font-semibold text-foreground">{selfie ? "Retake selfie" : "Open camera"}</button>
            <label className="flex items-start gap-2 text-[12px] text-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
              I agree that my details, documents and selfie will be securely saved by Velqorfi for KYC verification.
            </label>
            {err && <p className="text-[12px] text-danger">{err}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 rounded-2xl bg-muted py-3.5 text-[14px] font-semibold text-foreground">Back</button>
              <button disabled={!selfie || !consent || busy} onClick={submit} className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-buy-gradient py-3.5 text-[14px] font-semibold text-brand-foreground disabled:opacity-50">
                {busy ? "Submitting…" : <>Submit <Check className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
        )}
        {selfieCam && <CameraBox facing="user" auto onShot={(d) => { setSelfie(d); setSelfieCam(false); }} onClose={() => setSelfieCam(false)} />}
      </div>
    </div>
  );
}
