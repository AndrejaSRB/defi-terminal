export function formatTokenName(tokenName: string): string {
	if (!tokenName) return '';
	const colonIndex = tokenName.indexOf(':');
	if (colonIndex === -1) return tokenName;
	return tokenName.substring(colonIndex + 1);
}

export function hasTokenPrefix(tokenName: string): boolean {
	return typeof tokenName === 'string' && tokenName.includes(':');
}

export function getTokenPrefix(tokenName: string): string | null {
	if (!hasTokenPrefix(tokenName)) return null;
	return tokenName.substring(0, tokenName.indexOf(':'));
}

export function parseTokenName(tokenName: string): {
	formattedTokenName: string;
	dexName: string | null;
} {
	return {
		formattedTokenName: formatTokenName(tokenName),
		dexName: getTokenPrefix(tokenName),
	};
}
