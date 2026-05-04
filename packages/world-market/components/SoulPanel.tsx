// Inline TRAITS to avoid pulling Node.js-only SDK deps into the client bundle
const TRAITS = [
  'honesty', 'cunning', 'bravery', 'curiosity', 'cruelty', 'loyalty',
  'greed', 'patience', 'eloquence', 'wisdom', 'humor', 'ambition',
  'empathy', 'paranoia', 'pride', 'mercy',
] as const;

export function SoulPanel({ soul }: { soul: any | null }) {
  if (!soul) return <div className="border border-neon/30 p-4">// loading...</div>;
  const top = TRAITS.map((t) => ({ t, v: soul.personality[t] as number }))
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 5);

  return (
    <div className="border border-neon/40 bg-steel/40 p-4 space-y-3 font-mono text-sm">
      <h3 className="text-rose">// SOUL #{soul.tokenId}</h3>
      <p className="text-xs text-haze">worlds: [{soul.worldHistory?.join(', ')}]</p>

      <div>
        <p className="text-xs text-amber mb-1">// traits</p>
        {top.map((x) => (
          <div key={x.t} className="flex items-center gap-2 text-xs">
            <span className="w-20">{x.t}</span>
            <div className="flex-1 bg-void h-2 relative">
              <div className="h-full bg-neon"
                style={{ width: `${(Math.abs(x.v) * 50).toFixed(0)}%`, marginLeft: x.v < 0 ? `${50 - Math.abs(x.v) * 50}%` : '50%' }} />
            </div>
            <span className="w-10 text-right">{x.v.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-amber mb-1">// memories ({soul.memories?.length ?? 0})</p>
        <ul className="text-xs space-y-1 max-h-40 overflow-auto">
          {(soul.memories ?? []).slice(-6).reverse().map((m: any) => (
            <li key={m.id} className={`border-l-2 pl-2 ${m.worldId === 'tavern' ? 'border-rose' : 'border-neon'}`}>
              [{m.worldId}] {m.summary}
            </li>
          ))}
        </ul>
      </div>

      {soul.skills?.length > 0 && (
        <div>
          <p className="text-xs text-amber mb-1">// skills</p>
          <div className="flex flex-wrap gap-1">
            {soul.skills.map((s: string) => (
              <span key={s} className="px-2 py-0.5 border border-neon/60 text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
