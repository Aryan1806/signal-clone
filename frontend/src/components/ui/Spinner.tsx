export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}
