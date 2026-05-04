export function DriftAnimation({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90">
      <div className="text-center">
        <p className="text-4xl font-display glitch animate-pulse">DRIFTING</p>
        <p className="text-haze mt-4 text-sm">// re-encrypting soul metadata via oracle TEE...</p>
        <div className="mt-8 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-8 bg-neon animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
