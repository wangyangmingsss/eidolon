import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from './env.js';
import { getEndpoints } from './constants.js';
import { addresses } from './addresses.js';
import pino from 'pino';

const log = pino({ name: 'eidolon:chain' });
const ep = getEndpoints(env.OG_NETWORK);

export const publicClient = createPublicClient({ transport: http(env.OG_RPC_URL || ep.rpcUrl) });

export const account = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
export const walletClient = createWalletClient({
  account,
  transport: http(env.OG_RPC_URL || ep.rpcUrl),
});

const SOUL_NFT_ABI = parseAbi([
  'function mint(address to, bytes32 metadataRoot, string encryptedURI) returns (uint256)',
  'function updateMetadata(uint256 tokenId, bytes32 newRoot, string newEncryptedURI)',
  'function metadataRootOf(uint256 tokenId) view returns (bytes32)',
  'function encryptedURIOf(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function pendingDrift(uint256 tokenId) view returns (address to, bool active)',
  'function setApprovalForAll(address operator, bool approved)',
  'event SoulMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataRoot)',
  'event MetadataUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot)',
  'event DriftRequested(uint256 indexed tokenId, address indexed from, address indexed to)',
  'event DriftCompleted(uint256 indexed tokenId, address indexed newOwner, bytes32 newMetadataRoot)',
]);

const MARKET_ABI = parseAbi([
  'function list(uint256 tokenId, uint128 price)',
  'function buy(uint256 tokenId) payable',
  'function settle(uint256 tokenId)',
  'function listings(uint256 tokenId) view returns (address seller, uint128 price, bool active)',
]);

export async function mintSoul(to: `0x${string}`, root: `0x${string}`, uri: string): Promise<bigint> {
  const hash = await walletClient.writeContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'mint',
    args: [to, root, uri],
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const events = await publicClient.getContractEvents({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    eventName: 'SoulMinted',
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });
  const event = events.find((e) => e.transactionHash === hash);
  if (!event) throw new Error('SoulMinted event not found');
  const tokenId = event.args.tokenId;
  if (typeof tokenId === 'undefined') throw new Error('tokenId missing');
  log.info({ tokenId: tokenId.toString(), tx: hash }, 'Soul minted');
  return tokenId;
}

export async function updateMetadata(tokenId: bigint, root: `0x${string}`, uri: string): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'updateMetadata',
    args: [tokenId, root, uri],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function metadataRootOf(tokenId: bigint): Promise<`0x${string}`> {
  return await publicClient.readContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'metadataRootOf',
    args: [tokenId],
  });
}

export async function encryptedURIOf(tokenId: bigint): Promise<string> {
  return await publicClient.readContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'encryptedURIOf',
    args: [tokenId],
  });
}

export async function ownerOf(tokenId: bigint): Promise<`0x${string}`> {
  return await publicClient.readContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  });
}

export async function approveMarketplace(): Promise<void> {
  const hash = await walletClient.writeContract({
    address: addresses.SoulNFT,
    abi: SOUL_NFT_ABI,
    functionName: 'setApprovalForAll',
    args: [addresses.Marketplace, true],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

export async function listOnMarket(tokenId: bigint, priceWei: bigint): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: addresses.Marketplace,
    abi: MARKET_ABI,
    functionName: 'list',
    args: [tokenId, priceWei],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function buyOnMarket(tokenId: bigint, priceWei: bigint): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: addresses.Marketplace,
    abi: MARKET_ABI,
    functionName: 'buy',
    args: [tokenId],
    value: priceWei,
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
