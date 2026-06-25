import markAsset from "@/assets/velqorfi-mark.png.asset.json";
import darkLogoAsset from "@/assets/velqorfi-full.png.asset.json";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="Velqorfi"
      className={`object-contain ${className || ""}`}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={darkLogoAsset.url}
      height={size}
      alt="Velqorfi"
      className="object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
}

