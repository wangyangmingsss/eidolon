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
console.log('tavern portraits generated:', out);

const marketOut = resolve(process.cwd(), 'packages/world-market/public/npc-portraits');
mkdirSync(marketOut, { recursive: true });

const marketNpcs = [
  { id: 'zero', initials: '0', bg: '#0a0118', stroke: '#00f0ff' },
  { id: 'reka', initials: 'R', bg: '#1a1a2e', stroke: '#ff2a6d' },
  { id: 'ghoul', initials: 'G', bg: '#1a1a2e', stroke: '#fcee0a' },
];

for (const n of marketNpcs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="${n.bg}"/>
  <rect x="4" y="4" width="152" height="152" fill="none" stroke="${n.stroke}" stroke-width="2"/>
  <text x="80" y="105" font-family="monospace" font-size="80" text-anchor="middle" fill="${n.stroke}">${n.initials}</text>
</svg>`;
  writeFileSync(resolve(marketOut, `${n.id}.svg`), svg);
}
console.log('market portraits generated:', marketOut);
