const isDev = import.meta.env.DEV;

export const EXTENDED_CONFIG = {
	// Both dev (Vite proxy) and prod (Vercel serverless) use same path
	REST_URL: '/api/extended/api/v1',

	ONBOARDING_URL: '/api/extended',

	// Dev: WS relay through Vite proxy. Prod: direct to Extended (WS has no CORS)
	WEBSOCKET_URL: isDev
		? 'ws://localhost:5173/ws-extended/stream.extended.exchange/v1'
		: 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1',

	/** EIP-712 signing domain — only 'name' field per Extended SDK */
	SIGNING_DOMAIN: {
		name: 'extended.exchange',
	} as const,

	/** Host for registration message */
	HOST: 'extended.exchange',

	/** Referral code */
	REFERRAL_CODE: 'TEGRA',
};

/** EIP-712 types for AccountCreation (L2 key derivation) */
export const ACCOUNT_CREATION_TYPES = {
	AccountCreation: [
		{ name: 'accountIndex', type: 'int8' },
		{ name: 'wallet', type: 'address' },
		{ name: 'tosAccepted', type: 'bool' },
	],
} as const;

/** EIP-712 types for AccountRegistration (onboarding l1_signature) */
export const ACCOUNT_REGISTRATION_TYPES = {
	AccountRegistration: [
		{ name: 'accountIndex', type: 'int8' },
		{ name: 'wallet', type: 'address' },
		{ name: 'tosAccepted', type: 'bool' },
		{ name: 'time', type: 'string' },
		{ name: 'action', type: 'string' },
		{ name: 'host', type: 'string' },
	],
} as const;
