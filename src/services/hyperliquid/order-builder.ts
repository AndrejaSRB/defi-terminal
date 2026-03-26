import { encode } from '@msgpack/msgpack';
import { keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type {
	PlaceOrderParams,
	CancelOrderParams,
	ModifyOrderParams,
	UpdateLeverageParams,
} from '@/normalizer/exchange';
import { splitSignature } from './agent';

// ── Asset Index ─────────────────────────────────────────────────────

let universeOrderRef: string[][] = [];

export function setUniverseOrder(order: string[][]) {
	universeOrderRef = order;
}

export function getAssetIndex(coin: string): number {
	for (let gi = 0; gi < universeOrderRef.length; gi++) {
		const idx = universeOrderRef[gi].indexOf(coin);
		if (idx !== -1) return gi === 0 ? idx : 10000 + idx;
	}
	throw new Error(`Unknown asset: ${coin}`);
}

// ── L1 Signing (Phantom Agent) ──────────────────────────────────────
// Domain for L1 actions — different from user-signed actions
const L1_DOMAIN = {
	name: 'Exchange',
	version: '1',
	chainId: 1337,
	verifyingContract:
		'0x0000000000000000000000000000000000000000' as `0x${string}`,
};

const AGENT_TYPES = {
	Agent: [
		{ name: 'source', type: 'string' },
		{ name: 'connectionId', type: 'bytes32' },
	],
};

// Strip undefined values recursively (HL SDK: removeUndefinedKeys)
function cleanAction(obj: unknown): unknown {
	if (obj === null || obj === undefined) return obj;
	if (Array.isArray(obj)) return obj.map(cleanAction);
	if (typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			if (value !== undefined) {
				result[key] = cleanAction(value);
			}
		}
		return result;
	}
	// Convert integers exceeding 32-bit signed range to BigInt for msgpack
	// SDK threshold: >= 0x100000000 (4294967296) or < -0x80000000 (-2147483648)
	if (
		typeof obj === 'number' &&
		Number.isInteger(obj) &&
		(obj >= 0x100000000 || obj < -0x80000000)
	) {
		return BigInt(obj);
	}
	return obj;
}

// Convert hex string to Uint8Array (browser-compatible, no Buffer)
function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < clean.length; i += 2) {
		bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
	}
	return bytes;
}

function actionHash(
	action: unknown,
	nonce: number,
	vaultAddress: string | null,
	expiresAfter: number | null,
): `0x${string}` {
	// 1. Clean + msgpack serialize the action
	const msgpackBytes = encode(cleanAction(action));

	// 2. Nonce as 8-byte big-endian
	const nonceBytes = new Uint8Array(8);
	new DataView(nonceBytes.buffer).setBigUint64(0, BigInt(nonce));

	// 3. Vault address flag (0x00 = no vault, 0x01 + 20 bytes = vault)
	let vaultBytes: Uint8Array;
	if (vaultAddress) {
		const addrBytes = hexToBytes(vaultAddress);
		vaultBytes = new Uint8Array(1 + addrBytes.length);
		vaultBytes[0] = 1;
		vaultBytes.set(addrBytes, 1);
	} else {
		vaultBytes = new Uint8Array([0]);
	}

	// 4. Expires: marker 0x00 + 8-byte timestamp when present, empty when absent
	// (SDK: expiresMarker is [0] when present, [] when absent — NOT like vault)
	let expiresMarker: Uint8Array;
	let expiresTimeBytes: Uint8Array;
	if (expiresAfter !== null) {
		expiresMarker = new Uint8Array([0]);
		expiresTimeBytes = new Uint8Array(8);
		new DataView(expiresTimeBytes.buffer).setBigUint64(0, BigInt(expiresAfter));
	} else {
		expiresMarker = new Uint8Array();
		expiresTimeBytes = new Uint8Array();
	}

	// 5. Concatenate and keccak256
	const totalLen =
		msgpackBytes.length +
		nonceBytes.length +
		vaultBytes.length +
		expiresMarker.length +
		expiresTimeBytes.length;
	const combined = new Uint8Array(totalLen);
	let offset = 0;
	combined.set(msgpackBytes, offset);
	offset += msgpackBytes.length;
	combined.set(nonceBytes, offset);
	offset += nonceBytes.length;
	combined.set(vaultBytes, offset);
	offset += vaultBytes.length;
	combined.set(expiresMarker, offset);
	offset += expiresMarker.length;
	combined.set(expiresTimeBytes, offset);

	return keccak256(combined);
}

export async function signAction(
	action: unknown,
	agentPrivateKey: `0x${string}`,
	nonce: number,
): Promise<{
	action: unknown;
	nonce: number;
	signature: { r: string; s: string; v: number };
	vaultAddress: null;
	isFrontend: true;
	expiresAfter: number;
}> {
	const account = privateKeyToAccount(agentPrivateKey);
	const expiresAfter = nonce + 14_000;

	// Compute action hash (msgpack + nonce + vault + expires)
	const connectionId = actionHash(action, nonce, null, expiresAfter);

	// Sign phantom agent typed data
	const signature = await account.signTypedData({
		domain: L1_DOMAIN,
		primaryType: 'Agent',
		types: AGENT_TYPES,
		message: {
			source: 'a', // "a" for mainnet
			connectionId,
		},
	});

	const { r, s, v } = splitSignature(signature);

	return {
		action,
		nonce,
		signature: { r, s, v },
		vaultAddress: null,
		isFrontend: true,
		expiresAfter,
	};
}

// ── Order Action Builder ────────────────────────────────────────────

function buildTif(params: PlaceOrderParams) {
	if (params.type === 'market') {
		return { limit: { tif: 'FrontendMarket' as const } };
	}
	return { limit: { tif: (params.tif ?? 'Gtc') as string } };
}

export function buildOrderAction(params: PlaceOrderParams) {
	const assetIndex = getAssetIndex(params.coin);
	const orders: unknown[] = [
		{
			a: assetIndex,
			b: params.side === 'buy',
			p: params.price.toString(),
			s: params.size.toString(),
			r: params.reduceOnly,
			t: buildTif(params),
			...(params.cloid ? { c: params.cloid } : {}),
		},
	];

	if (params.tp) {
		orders.push({
			a: assetIndex,
			b: params.side !== 'buy',
			p: params.tp.toString(),
			s: params.size.toString(),
			r: true,
			t: {
				trigger: {
					isMarket: true,
					triggerPx: params.tp.toString(),
					tpsl: 'tp',
				},
			},
		});
	}
	if (params.sl) {
		orders.push({
			a: assetIndex,
			b: params.side !== 'buy',
			p: params.sl.toString(),
			s: params.size.toString(),
			r: true,
			t: {
				trigger: {
					isMarket: true,
					triggerPx: params.sl.toString(),
					tpsl: 'sl',
				},
			},
		});
	}

	const grouping =
		params.tp || params.sl ? ('normalTpsl' as const) : ('na' as const);

	return { type: 'order' as const, orders, grouping };
}

// ── Cancel Action Builder ───────────────────────────────────────────

export function buildCancelAction(params: CancelOrderParams[]) {
	return {
		type: 'cancel' as const,
		cancels: params.map((cancel) => ({
			a: getAssetIndex(cancel.coin),
			o: cancel.orderId,
		})),
	};
}

// ── Modify Action Builder ───────────────────────────────────────────

export function buildModifyAction(params: ModifyOrderParams) {
	return {
		type: 'modify' as const,
		oid: params.orderId,
		order: {
			a: getAssetIndex(params.coin),
			b: true,
			p: params.price.toString(),
			s: params.size.toString(),
			r: params.reduceOnly,
			t: { limit: { tif: (params.tif ?? 'Gtc') as string } },
		},
	};
}

// ── UpdateLeverage Action Builder ───────────────────────────────────

export function buildUpdateLeverageAction(params: UpdateLeverageParams) {
	return {
		type: 'updateLeverage' as const,
		asset: getAssetIndex(params.coin),
		isCross: params.isCross,
		leverage: params.leverage,
	};
}
