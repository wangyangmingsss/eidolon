import { JsonRpcProvider, Wallet } from 'ethers';
import { env } from './env.js';
import { getEndpoints } from './constants.js';
import { ActionResultSchema, type ActionResult } from './types.js';
import pino from 'pino';

const log = pino({ name: 'eidolon:inference' });

let _broker: any = null;
async function getBroker() {
  if (_broker) return _broker;
  const ep = getEndpoints(env.OG_NETWORK);
  const provider = new JsonRpcProvider(env.OG_RPC_URL || ep.rpcUrl);
  const wallet = new Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
  const broker = await import('@0glabs/0g-serving-broker');
  const { createZGServingNetworkBroker } = broker as any;
  _broker = await (createZGServingNetworkBroker as any)(wallet);
  if (env.LLM_MODEL_PROVIDER) {
    try { await _broker.inference.acknowledgeProviderSigner(env.LLM_MODEL_PROVIDER); } catch { /* already acknowledged */ }
  }
  return _broker;
}

export interface InferRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  requestId?: string;
}

export interface InferResponse {
  result: ActionResult;
  raw: string;
  signatureValid: boolean;
  providerId: string;
  modelName: string;
}

/// Run a TEE-verified chat completion and parse the JSON response.
export async function infer(req: InferRequest): Promise<InferResponse> {
  if (!env.LLM_MODEL_PROVIDER || !env.LLM_MODEL_NAME) {
    throw new Error('LLM_MODEL_PROVIDER / LLM_MODEL_NAME not set. Run pnpm verify (Doc 1).');
  }
  const broker = await getBroker();
  const ep = getEndpoints(env.OG_NETWORK);

  const reqId = req.requestId ?? `eid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const headers = await broker.inference.getRequestHeaders(env.LLM_MODEL_PROVIDER, reqId);

  const url = (await broker.inference.getServiceMetadata?.(env.LLM_MODEL_PROVIDER))?.endpoint
    || `${ep.computeMarketplace}/v1/chat/completions`;

  const body = {
    model: env.LLM_MODEL_NAME,
    messages: [
      { role: 'system', content: req.system },
      { role: 'user', content: req.user },
    ],
    max_tokens: req.maxTokens ?? 400,
    temperature: req.temperature ?? 0.85,
  };

  log.debug({ url, model: env.LLM_MODEL_NAME }, 'sending inference');
  const resp = await fetch(`${url}/v1/chat/completions`.replace('//v1', '/v1'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Inference failed (${resp.status}): ${await resp.text()}`);
  const json: any = await resp.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? '';

  const signatureValid = await broker.inference.processResponse(env.LLM_MODEL_PROVIDER, raw, json?.id ?? reqId);

  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  let parsed: ActionResult;
  try {
    parsed = ActionResultSchema.parse(JSON.parse(cleaned));
  } catch (e) {
    log.error({ raw }, 'Failed to parse model output');
    throw new Error(`Soul output not valid JSON: ${(e as Error).message}\n\nRaw:\n${raw}`);
  }

  return { result: parsed, raw, signatureValid, providerId: env.LLM_MODEL_PROVIDER, modelName: env.LLM_MODEL_NAME };
}
