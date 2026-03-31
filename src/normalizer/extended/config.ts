const isDev = import.meta.env.DEV;

const wsProtocol = isDev ? 'ws' : 'wss';
const wsHost = isDev ? 'localhost:5173' : 'api.starknet.extended.exchange';

export const EXTENDED_CONFIG = {
	REST_URL: isDev
		? '/api/extended/api/v1'
		: 'https://api.starknet.extended.exchange/api/v1',

	ONBOARDING_URL: isDev
		? '/api/extended'
		: 'https://api.starknet.extended.exchange',

	WEBSOCKET_URL: `${wsProtocol}://${wsHost}/ws-extended/stream.extended.exchange/v1`,

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
