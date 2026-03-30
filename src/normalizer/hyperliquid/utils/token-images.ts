const HL_COINS_BASE_URL = 'https://app.hyperliquid.xyz/coins';

const TOKEN_EXCEPTIONS: Record<string, string> = {
	kPEPE: 'PEPE',
	kFLOKI: 'FLOKI',
	kSHIB: 'SHIB',
	kNEIRO: 'NEIRO',
	kLUNC: 'LUNC',
	kDOGS: 'DOGS',
	kBONK: 'BONK',
};

export function hlGetTokenImageUrl(coin: string): string {
	const mapped = TOKEN_EXCEPTIONS[coin] ?? coin;
	return `${HL_COINS_BASE_URL}/${mapped}.svg`;
}
