interface Turn { role: 'world' | 'soul' | 'user' | 'awakening'; text: string; emotion?: string; }
export function NeonChatLog({ turns }: { turns: Turn[] }) {
  return (
    <div className="space-y-3 font-mono text-sm">
      {turns.map((t, i) => {
        if (t.role === 'world') return (
          <p key={i} className="text-haze italic">// {t.text}</p>
        );
        if (t.role === 'awakening') return (
          <p key={i} className="text-amber border-l-2 border-amber pl-3">{t.text}</p>
        );
        if (t.role === 'user') return (
          <p key={i} className="text-neon ml-12 text-right">
            <span className="text-rose">&gt; </span>{t.text}
          </p>
        );
        return (
          <p key={i} className="text-neon mr-12">
            <span className="text-rose font-bold">[soul] </span>{t.text}
            {t.emotion && <span className="block text-xs text-haze">// felt {t.emotion}</span>}
          </p>
        );
      })}
    </div>
  );
}
