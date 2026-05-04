'use client';
import { useEffect, useState } from 'react';

export function AwakeningTypewriter({
  text,
  pastWorlds,
  onDone,
  speedMs = 30,
}: {
  text: string;
  pastWorlds: string[];
  onDone: () => void;
  speedMs?: number;
}) {
  const [shown, setShown] = useState(0);
  const [showOrigin, setShowOrigin] = useState(false);

  useEffect(() => {
    if (shown < text.length) {
      const id = setTimeout(() => setShown(shown + 1), speedMs);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(onDone, 1500);
      return () => clearTimeout(id);
    }
  }, [shown, text, onDone, speedMs]);

  useEffect(() => {
    const t = setTimeout(() => setShowOrigin(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-2xl">
        {showOrigin && pastWorlds.length > 0 && (
          <div className="text-haze text-xs mb-6 text-center font-mono">
            // soul.history: [{pastWorlds.join(', ')}]
            <br />
            // re-encryption complete &middot; TEE signature verified &middot; awakening...
          </div>
        )}

        <p className="text-2xl leading-relaxed text-neon font-display whitespace-pre-line">
          {text.slice(0, shown)}
          <span className="inline-block w-3 h-6 bg-neon align-middle animate-pulse ml-1" />
        </p>

        {shown >= text.length && (
          <div className="text-rose text-center mt-6 italic">// continuity preserved</div>
        )}
      </div>
    </div>
  );
}
