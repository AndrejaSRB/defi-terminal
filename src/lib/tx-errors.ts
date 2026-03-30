const USER_REJECTED_PATTERNS = [
	'User rejected',
	'User denied',
	'user rejected',
	'user denied',
	'ACTION_REJECTED',
	'UserRejectedRequestError',
];

const INSUFFICIENT_FUNDS_PATTERNS = [
	'insufficient funds',
	'Insufficient funds',
	'INSUFFICIENT_FUNDS',
	'not enough balance',
];

export function classifyTxError(error: unknown): {
	type: 'rejected' | 'insufficient_funds' | 'unknown';
	message: string;
} {
	const message = error instanceof Error ? error.message : String(error);

	if (USER_REJECTED_PATTERNS.some((pattern) => message.includes(pattern))) {
		return { type: 'rejected', message: 'Transaction rejected by user' };
	}

	if (
		INSUFFICIENT_FUNDS_PATTERNS.some((pattern) => message.includes(pattern))
	) {
		return {
			type: 'insufficient_funds',
			message: 'Insufficient funds for gas',
		};
	}

	return { type: 'unknown', message: 'Transaction failed' };
}
