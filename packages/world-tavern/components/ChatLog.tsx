interface Turn { role: 'world' | 'soul' | 'user'; text: string; emotion?: string; }
export function ChatLog({ turns }: { turns: Turn[] }) {
  return (
    <div className="space-y-3">
      {turns.map((t, i) => {
        if (t.role === 'world') return <p key={i} className="italic text-ash">{t.text}</p>;
        if (t.role === 'user') return (
          <p key={i} className="ml-12 text-right">
            <span className="font-bold">You: </span>{t.text}
          </p>
        );
        return (
          <p key={i} className="mr-12">
            <span className="font-bold text-ember">Soul: </span>{t.text}
            {t.emotion && <em className="block text-sm text-ash mt-1">&mdash; felt {t.emotion}</em>}
          </p>
        );
      })}
    </div>
  );
}
