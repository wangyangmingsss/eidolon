// Inline TRAITS to avoid pulling Node.js-only SDK deps into the client bundle
const TRAITS = [
  'honesty', 'cunning', 'bravery', 'curiosity', 'cruelty', 'loyalty',
  'greed', 'patience', 'eloquence', 'wisdom', 'humor', 'ambition',
  'empathy', 'paranoia', 'pride', 'mercy',
] as const;

export function SoulPanel({ soul }: { soul: any | null }) {
  if (!soul) return <div className="bg-parchment/80 p-4 rounded">Loading soul...</div>;
  const top = TRAITS
    .map((t) => ({ t, v: soul.personality[t] as number }))
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 5);

  return (
    <div className="bg-parchment/80 p-4 rounded space-y-3">
      <h3 className="font-bold">Soul #{soul.tokenId}</h3>

      <div>
        <p className="text-xs text-ash mb-1">Defining traits:</p>
        {top.map((x) => (
          <div key={x.t} className="flex items-center gap-2 text-sm">
            <span className="w-20">{x.t}</span>
            <div className="flex-1 bg-ash/30 h-2 rounded relative">
              <div
                className="h-full bg-ember rounded"
                style={{
                  width: `${(Math.abs(x.v) * 50).toFixed(0)}%`,
                  marginLeft: x.v < 0 ? `${50 - Math.abs(x.v) * 50}%` : '50%',
                }}
              />
            </div>
            <span className="text-xs w-10 text-right">{x.v.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-ash mb-1">Recent memories ({soul.memories.length}):</p>
        <ul className="text-xs space-y-1 max-h-40 overflow-auto">
          {soul.memories.slice(-5).reverse().map((m: any) => (
            <li key={m.id} className="border-l-2 border-ember pl-2">
              [{m.worldId}] {m.summary}
            </li>
          ))}
        </ul>
      </div>

      {soul.skills?.length > 0 && (
        <div>
          <p className="text-xs text-ash mb-1">Skills:</p>
          <div className="flex flex-wrap gap-1">
            {soul.skills.map((s: string) => (
              <span key={s} className="px-2 py-0.5 bg-ink text-parchment text-xs rounded">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
