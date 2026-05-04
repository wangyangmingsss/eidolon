'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TASKS, NPCS } from '@/lib/market-config';
import { awaken, postAct, fetchSoul } from '@/lib/api-client';
import { NeonChatLog } from '@/components/NeonChatLog';
import { AwakeningTypewriter } from '@/components/AwakeningTypewriter';
import { SoulPanel } from '@/components/SoulPanel';
import { TerminalCard } from '@/components/TerminalCard';

interface ChatTurn { role: 'world' | 'soul' | 'user' | 'awakening'; text: string; emotion?: string; }

export default function MarketPageWrapper() {
  return (
    <Suspense fallback={<main className="p-8 relative z-10">Loading market...</main>}>
      <MarketPage />
    </Suspense>
  );
}

function MarketPage() {
  const params = useSearchParams();
  const tokenId = params.get('token');

  const [phase, setPhase] = useState<'idle' | 'awakening' | 'awakened' | 'task'>('idle');
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [taskIdx, setTaskIdx] = useState(-1);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [soul, setSoul] = useState<any | null>(null);
  const [awakeningResp, setAwakeningResp] = useState<{ monologue: string; pastWorlds: string[] } | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!tokenId) return;
    fetchSoul(tokenId).then(setSoul).catch(console.error);
  }, [tokenId]);

  // On first mount: trigger awakening
  useEffect(() => {
    if (!tokenId || initRef.current) return;
    initRef.current = true;
    (async () => {
      setPhase('awakening');
      try {
        const r = await awaken(tokenId);
        setAwakeningResp(r);
        setSoul(r.soul);
      } catch (e) {
        setChat([{ role: 'world', text: 'Awakening failed: ' + (e as Error).message }]);
        setPhase('idle');
      }
    })();
  }, [tokenId]);

  if (!tokenId) {
    return <main className="p-8 relative z-10">No token in URL. Go to landing first.</main>;
  }

  const onAwakeningDone = () => {
    setChat([{ role: 'awakening', text: awakeningResp!.monologue }]);
    setPhase('awakened');
  };

  const onBeginTask = (idx: number) => {
    const task = TASKS[idx];
    if (!task) return;
    setTaskIdx(idx);
    setChat((c) => [...c, { role: 'world', text: task.scenePrompt }]);
    setPhase('task');
  };

  const task = taskIdx >= 0 ? TASKS[taskIdx] : null;

  const onSend = async () => {
    if (!input.trim() || thinking || !task) return;
    const userText = input.trim();
    setInput('');
    setChat((c) => [...c, { role: 'user', text: userText }]);
    setThinking(true);
    try {
      const r = await postAct({ tokenId, taskId: task.id, userInput: userText });
      setChat((c) => [...c, { role: 'soul', text: r.action, emotion: r.emotion }]);
      setSoul(r.soul);
    } catch (e) {
      setChat((c) => [...c, { role: 'world', text: 'Error: ' + (e as Error).message }]);
    } finally {
      setThinking(false);
    }
  };

  const userTurns = chat.filter((c) => c.role === 'user').length;
  const taskComplete = task && userTurns >= task.minTurns;

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 min-h-screen relative z-10">
      <section className="flex flex-col h-[90vh]">
        <header className="mb-4">
          <h1 className="text-3xl font-display glitch">THE ECHO MARKET</h1>
          <p className="text-haze text-sm">// Soul #{tokenId} now in transit</p>
        </header>

        {phase === 'awakening' && awakeningResp && (
          <AwakeningTypewriter text={awakeningResp.monologue} pastWorlds={awakeningResp.pastWorlds} onDone={onAwakeningDone} />
        )}

        {phase === 'awakened' && (
          <TerminalCard>
            <p className="mb-4">Your soul is oriented. Pick an encounter:</p>
            <div className="flex gap-3 flex-wrap">
              {TASKS.map((t, i) => (
                <button key={t.id} onClick={() => onBeginTask(i)}
                  className="px-4 py-2 border border-neon hover:shadow-neon">
                  {t.title}
                </button>
              ))}
            </div>
          </TerminalCard>
        )}

        {phase === 'task' && task && (
          <>
            <h2 className="text-xl text-rose mb-2">{task.title}</h2>
            <p className="text-haze italic mb-3">// {task.hint}</p>

            <div className="flex-1 overflow-auto bg-steel/40 border border-neon/30 p-4 rounded">
              <NeonChatLog turns={chat} />
              {thinking && <p className="text-haze animate-pulse">// soul.processing...</p>}
            </div>

            <div className="flex gap-2 mt-4">
              <input
                className="flex-1 bg-void border border-neon/50 px-3 py-2 text-neon font-mono"
                placeholder="> respond..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSend()}
                disabled={thinking}
              />
              <button onClick={onSend} disabled={thinking}
                className="px-4 py-2 border border-rose text-rose hover:shadow-rose disabled:opacity-50">
                Transmit
              </button>
            </div>

            {taskComplete && taskIdx < TASKS.length - 1 && (
              <button onClick={() => onBeginTask(taskIdx + 1)}
                className="mt-4 px-4 py-2 border border-amber text-amber">
                Next encounter &rarr;
              </button>
            )}
            {taskComplete && taskIdx === TASKS.length - 1 && (
              <p className="mt-4 text-amber italic text-center">
                // The market gives the soul nothing it didn&apos;t already have. End scene.
              </p>
            )}
          </>
        )}
      </section>

      <aside className="space-y-4">
        <SoulPanel soul={soul} />
      </aside>
    </main>
  );
}
