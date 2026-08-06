export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      loading="lazy"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
