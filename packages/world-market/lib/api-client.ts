export async function awaken(tokenId: string) {
  const r = await fetch('/api/awaken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    monologue: string;
    emotion?: string;
    referencedMemoryIds: string[];
    pastWorlds: string[];
    soul: any;
  }>;
}

export async function postAct(input: { tokenId: string; taskId: string; userInput: string; }) {
  const r = await fetch('/api/act', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listSoul(tokenId: string, priceOG: number) {
  const r = await fetch('/api/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, priceOG }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function buySoul(tokenId: string, priceOG: number) {
  const r = await fetch('/api/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, priceOG }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchSoul(tokenId: string) {
  const r = await fetch(`/api/soul/${tokenId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
