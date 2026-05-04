'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ChatLog } from '@/components/ChatLog';
import { NPCPortrait } from '@/components/NPCPortrait';
import { SoulPanel } from '@/components/SoulPanel';
import { TaskTracker } from '@/components/TaskTracker';
import { ThinkingDots } from '@/components/ThinkingDots';
import { TASKS, NPCS } from '@/lib/tavern-config';
import { fetchSoul, postAct } from '@/lib/api-client';

interface ChatTurn { role: 'world' | 'soul' | 'user'; text: string; emotion?: string; }

export default function TavernPageWrapper() {
  return (
    <Suspense fallback={<main className="p-8">Loading tavern...</main>}>
      <TavernPage />
    </Suspense>
  );
}

function TavernPage() {
  const { address } = useAccount();
  const params = useSearchParams();
  const tokenId = params.get('token');

  const [taskIdx, setTaskIdx] = useState(0);
  const task = TASKS[taskIdx];
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [soul, setSoul] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tokenId) return;
    fetchSoul(tokenId).then(setSoul).catch((e) => console.error('fetchSoul failed', e));
  }, [tokenId]);

  useEffect(() => {
    if (!task) return;
    setChat([{ role: 'world', text: task.scenePrompt }]);
  }, [task]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, thinking]);

  if (!tokenId || !address) {
    return <main className="p-8">Connect a wallet and visit the landing page first.</main>;
  }
  if (!task) return null;

  const onSend = async () => {
    if (!input.trim() || thinking) return;
    const userText = input.trim();
    setInput('');
    setChat((c) => [...c, { role: 'user', text: userText }]);
    setThinking(true);
    try {
      const r = await postAct({
        tokenId, taskId: task.id, userInput: userText, ownerAddress: address,
      });
      setChat((c) => [...c, { role: 'soul', text: r.action, emotion: r.emotion }]);
      setSoul(r.soul);
    } catch (e) {
      setChat((c) => [...c, { role: 'world', text: '(error: ' + (e as Error).message + ')' }]);
    } finally {
      setThinking(false);
    }
  };

  const onNextTask = () => {
    if (taskIdx < TASKS.length - 1) setTaskIdx(taskIdx + 1);
    else window.location.href = '/end?token=' + tokenId;
  };

  const userTurns = chat.filter((c) => c.role === 'user').length;
  const taskComplete = userTurns >= task.minTurns;

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 min-h-screen">
      <section className="flex flex-col h-[90vh]">
        <header className="mb-4 text-center">
          <h1 className="text-3xl">{task.title}</h1>
          <p className="italic text-ash">{task.hint}</p>
        </header>

        <div className="flex justify-center gap-4 mb-4">
          {task.presentNPCs.map((id) => (
            <NPCPortrait key={id} npc={NPCS[id]!} />
          ))}
        </div>

        <div className="flex-1 overflow-auto bg-parchment/70 p-4 rounded shadow-inner">
          <ChatLog turns={chat} />
          {thinking && <ThinkingDots />}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2 mt-4">
          <input
            className="flex-1 px-4 py-3 bg-parchment border border-ash rounded font-serif"
            placeholder="What does your soul do?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            disabled={thinking}
          />
          <button
            onClick={onSend}
            disabled={thinking}
            className="px-6 py-3 bg-ember text-parchment rounded disabled:opacity-50"
          >
            Speak
          </button>
        </div>

        {taskComplete && (
          <div className="mt-4 p-3 bg-ink/10 rounded text-center">
            <p className="italic mb-2">The moment passes. Memory is etched.</p>
            <button onClick={onNextTask} className="px-6 py-2 bg-ink text-parchment rounded">
              {taskIdx < TASKS.length - 1 ? 'On to the next encounter \u2192' : 'Leave the tavern \u2192'}
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <TaskTracker tasks={TASKS} currentIdx={taskIdx} />
        <SoulPanel soul={soul} />
      </aside>
    </main>
  );
}
