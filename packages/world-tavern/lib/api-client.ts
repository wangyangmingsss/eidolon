export interface MintResponse { tokenId: string; ownerAddress: string; }

export async function mintSoulFromBrowser(ownerAddress: string): Promise<MintResponse> {
  const r = await fetch('/api/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerAddress }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postAct(input: {
  tokenId: string;
  taskId: string;
  userInput: string;
  ownerAddress: string;
}) {
  const r = await fetch('/api/act', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ action: string; emotion?: string; soul: any; }>;
}

export async function fetchSoul(tokenId: string) {
  const r = await fetch(`/api/soul/${tokenId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
