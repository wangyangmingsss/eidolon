import type { NPC } from '@/lib/tavern-config';
export function NPCPortrait({ npc }: { npc: NPC }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-ash mx-auto mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={npc.portraitUrl}
          alt={npc.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <p className="text-xs">{npc.name.split(' ')[0]}</p>
    </div>
  );
}
