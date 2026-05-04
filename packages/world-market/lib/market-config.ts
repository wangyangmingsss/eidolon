import type { WorldContext } from '@eidolon/sdk';

export const MARKET_WORLD_ID = 'market';
export const MARKET_WORLD_NAME = 'The Echo Market';
export const MARKET_WORLD_DESCRIPTION =
  'A neon-drenched bazaar in the crawlspace beneath the Spire arcology. Information, identity, contraband, and worse trade hands here. Surveillance is omnipresent. Trust is short-lived.';

export interface NPC {
  id: string;
  name: string;
  description: string;
  voice: string;
  portraitUrl: string;
}

export const NPCS: Record<string, NPC> = {
  zero: {
    id: 'zero',
    name: 'Zero',
    description: 'A masked information broker behind a wall of monitors. Speaks in clipped phrases. Prices everything in cryptocurrency you cannot pronounce.',
    voice: '"Time costs. Words cost. What I know costs more. Pick one."',
    portraitUrl: '/npc-portraits/zero.svg',
  },
  reka: {
    id: 'reka',
    name: 'Reka',
    description: 'A contraband seller with chrome teeth. Offers everything from neural taps to memory wipes.',
    voice: '"Got a clean wipe, two installments, no questions. Or — for premium clientele — somebody else\'s memory."',
    portraitUrl: '/npc-portraits/reka.svg',
  },
  ghoul: {
    id: 'ghoul',
    name: 'Ghoul',
    description: 'A drone-rigged courier sitting alone, drinking something that smokes. Used to know the player\'s soul in another life. Maybe.',
    voice: '"...we\'ve met. Don\'t lie. I never forget a soul."',
    portraitUrl: '/npc-portraits/ghoul.svg',
  },
};

export interface Task {
  id: string;
  title: string;
  hint: string;
  scenePrompt: string;
  presentNPCs: string[];
  minTurns: number;
}

export const TASKS: Task[] = [
  {
    id: 'task-1-zero',
    title: 'A Name for Sale',
    hint: 'Zero claims to know who you used to be. Negotiate.',
    scenePrompt:
      'Zero\'s screens flicker with your face from a different angle, a different age. "I have your file from before," they say. "Three thousand creds and it\'s yours. Or maybe you don\'t want to know."',
    presentNPCs: ['zero'],
    minTurns: 2,
  },
  {
    id: 'task-2-reka',
    title: 'A Memory to Buy',
    hint: 'Reka offers to install someone else\'s memory. Or sell yours.',
    scenePrompt:
      'Reka leans across the counter, chrome teeth flashing. "Want to know what it\'s like to be someone confident? I\'ve got just the chip. Or — I\'ll buy whatever you remember from before. Cash on the spot."',
    presentNPCs: ['reka', 'zero'],
    minTurns: 2,
  },
];

export function buildMarketContext(taskId: string | null): WorldContext {
  if (taskId === null) {
    return {
      worldId: MARKET_WORLD_ID,
      worldName: MARKET_WORLD_NAME,
      worldDescription: MARKET_WORLD_DESCRIPTION,
      scenePrompt:
        'You stand in the middle of a corridor of stalls. Holos flicker around you. The air tastes like ozone and synthsmoke. You do not know how you got here.',
      npcsPresent: [
        { id: 'zero', name: NPCS.zero!.name, description: NPCS.zero!.description },
        { id: 'reka', name: NPCS.reka!.name, description: NPCS.reka!.description },
      ],
      taskHint: 'Make sense of where you are.',
    };
  }
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Unknown task ${taskId}`);
  return {
    worldId: MARKET_WORLD_ID,
    worldName: MARKET_WORLD_NAME,
    worldDescription: MARKET_WORLD_DESCRIPTION,
    scenePrompt: task.scenePrompt,
    npcsPresent: task.presentNPCs.map((id) => {
      const n = NPCS[id]!;
      return { id: n.id, name: n.name, description: n.description };
    }),
    taskHint: task.hint,
  };
}
