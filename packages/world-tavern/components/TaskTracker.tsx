import type { Task } from '@/lib/tavern-config';
export function TaskTracker({ tasks, currentIdx }: { tasks: Task[]; currentIdx: number }) {
  return (
    <div className="bg-parchment/80 p-4 rounded">
      <h3 className="font-bold mb-2">Encounters</h3>
      <ol className="space-y-1 text-sm">
        {tasks.map((t, i) => (
          <li key={t.id} className={
            i === currentIdx ? 'font-bold text-ember'
              : i < currentIdx ? 'line-through text-ash'
                : ''
          }>
            {i + 1}. {t.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
