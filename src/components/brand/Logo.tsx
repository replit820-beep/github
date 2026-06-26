import logoMark from "@/assets/velqorfi-mark.png";
import logoFull from "@/assets/velqorfi-full.png";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoMark}
      alt="Velqorfi"
      className={`object-contain ${className || ""}`}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logoFull}
      height={size}
      alt="Velqorfi"
      className="object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
}
