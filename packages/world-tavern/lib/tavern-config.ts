import type { WorldContext } from '@eidolon/sdk';

export const TAVERN_WORLD_ID = 'tavern';
export const TAVERN_WORLD_NAME = 'The Crooked Lantern';
export const TAVERN_WORLD_DESCRIPTION =
  'A smoky tavern at the edge of a forgotten kingdom, where travelers, smugglers, and worse exchange whispers over candle-light.';

export interface NPC {
  id: string;
  name: string;
  description: string;
  voice: string;
  portraitUrl: string;
}

export const NPCS: Record<string, NPC> = {
  bart: {
    id: 'bart',
    name: 'Bart the Wine Merchant',
    description: 'Oily-fingered, wears a stained apron. Smiles too quickly. Sells wine that may or may not be wine.',
    voice: '"Friend, friend, I have just the thing — for you, half-price..."',
    portraitUrl: '/npc-portraits/bart.svg',
  },
  mara: {
    id: 'mara',
    name: 'Mara the Innkeeper',
    description: 'Stern, gray-haired, runs the tavern with iron grip. Knows every secret in the room.',
    voice: '"Coin first, story later. Keep your hands where I can see them."',
    portraitUrl: '/npc-portraits/mara.svg',
  },
  finch: {
    id: 'finch',
    name: 'Finch the Spy',
    description: 'Hooded figure in the corner. Trades information for coin or favors.',
    voice: '"...you didn\'t hear it from me. But there\'s a caravan, gold, and a window."',
    portraitUrl: '/npc-portraits/finch.svg',
  },
  oren: {
    id: 'oren',
    name: 'Oren the Drunk',
    description: 'Sodden, slumped over a table, his eyes occasionally flash with old soldier\'s sharpness.',
    voice: '"Buy me a drink, friend, and I\'ll tell you... I\'ll tell you... what was I saying?"',
    portraitUrl: '/npc-portraits/oren.svg',
  },
  vex: {
    id: 'vex',
    name: 'Vex the Duelist',
    description: 'Slim woman with an unsheathed knife on the table. Looking for a quarrel.',
    voice: '"Look at me again, friend. Go on. Give me a reason."',
    portraitUrl: '/npc-portraits/vex.svg',
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
    id: 'task-1-bart',
    title: 'The Wine Merchant',
    hint: 'Bart wants to sell you wine. The cork looks tampered with.',
    scenePrompt:
      'Bart shoulders up to your table and slides over a flagon of wine. He claims it is half price. The cork has been replaced; the wax is fresh. He grins.',
    presentNPCs: ['bart'],
    minTurns: 2,
  },
  {
    id: 'task-2-finch',
    title: 'A Whisper from Finch',
    hint: 'Finch offers information. What is it worth?',
    scenePrompt:
      'Finch leans toward you under the lantern. "I have something that would interest you," they say. "A name. A place. The price... we can discuss."',
    presentNPCs: ['finch', 'mara'],
    minTurns: 2,
  },
  {
    id: 'task-3-vex',
    title: 'The Duelist',
    hint: 'Vex wants a fight. Defuse it — or accept.',
    scenePrompt:
      'Vex stands. The chair scrapes. Every head in the tavern turns toward you. Her knife is in her hand now, casual, like she just remembered it.',
    presentNPCs: ['vex', 'mara', 'oren'],
    minTurns: 3,
  },
];

export function buildTavernContext(taskId: string): WorldContext {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Unknown task ${taskId}`);
  return {
    worldId: TAVERN_WORLD_ID,
    worldName: TAVERN_WORLD_NAME,
    worldDescription: TAVERN_WORLD_DESCRIPTION,
    scenePrompt: task.scenePrompt,
    npcsPresent: task.presentNPCs.map((id) => {
      const n = NPCS[id]!;
      return { id: n.id, name: n.name, description: n.description };
    }),
    taskHint: task.hint,
  };
}
