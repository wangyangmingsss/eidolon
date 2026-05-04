import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const out = resolve(process.cwd(), 'packages/world-tavern/public/npc-portraits');
mkdirSync(out, { recursive: true });

const npcs = [
  { id: 'bart', initials: 'B', bg: '#c2410c', face: '\u{1F60F}' },
  { id: 'mara', initials: 'M', bg: '#525252', face: '\u{1F620}' },
  { id: 'finch', initials: 'F', bg: '#1c1917', face: '\u{1FAE5}' },
  { id: 'oren', initials: 'O', bg: '#7c2d12', face: '\u{1F635}\u200D\u{1F4AB}' },
  { id: 'vex', initials: 'V', bg: '#7f1d1d', face: '\u{1F608}' },
];

for (const n of npcs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="${n.bg}"/>
  <text x="80" y="100" font-family="Georgia, serif" font-size="80" text-anchor="middle" fill="#f3ead4">${n.initials}</text>
</svg>`;
  writeFileSync(resolve(out, `${n.id}.svg`), svg);
}
console.log('portraits generated:', out);
