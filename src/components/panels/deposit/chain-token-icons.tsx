import { memo } from 'react';
import { cn } from '@/lib/utils';

// ── Chain Icons ──

const CHAIN_ICONS: Record<string, string> = {
	ethereum: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
	arbitrum: 'https://chain-icons.s3.amazonaws.com/arbitrum.png',
	base: 'https://chain-icons.s3.amazonaws.com/base.png',
	optimism: 'https://chain-icons.s3.amazonaws.com/optimism.png',
	polygon: 'https://chain-icons.s3.amazonaws.com/polygon.png',
	avalanche: 'https://chain-icons.s3.amazonaws.com/avalanche.png',
	'binance-smart-chain': 'https://chain-icons.s3.amazonaws.com/bsc.png',
	solana: 'https://chain-icons.s3.amazonaws.com/solana.png',
};

// ── Fallback: colored circle with initial ──

const COLORS = [
	'bg-blue-500/20 text-blue-400',
	'bg-green-500/20 text-green-400',
	'bg-purple-500/20 text-purple-400',
	'bg-amber-500/20 text-amber-400',
	'bg-cyan-500/20 text-cyan-400',
	'bg-pink-500/20 text-pink-400',
];

function hashColor(label: string): string {
	let hash = 0;
	for (let index = 0; index < label.length; index++) {
		hash = label.charCodeAt(index) + ((hash << 5) - hash);
	}
	return COLORS[Math.abs(hash) % COLORS.length];
}

const FallbackIcon = ({
	label,
	className,
}: {
	label: string;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				'flex size-4 items-center justify-center rounded-full text-[8px] font-bold',
				hashColor(label),
				className,
			)}
		>
			{label.charAt(0).toUpperCase()}
		</div>
	);
};

// ── Exported Components ──

const ChainIcon = ({
	network,
	className,
}: {
	network: string;
	className?: string;
}) => {
	const src = CHAIN_ICONS[network];
	if (src) {
		return (
			<img
				src={src}
				alt={network}
				className={cn('size-4 rounded-full', className)}
			/>
		);
	}
	return (
		<FallbackIcon
			label={network.charAt(0).toUpperCase()}
			className={className}
		/>
	);
};

const TokenIcon = ({
	logo,
	symbol,
	className,
}: {
	logo: string | null;
	symbol: string;
	className?: string;
}) => {
	if (logo) {
		return (
			<img
				src={logo}
				alt={symbol}
				className={cn('size-4 rounded-full', className)}
				onError={(event) => {
					const target = event.currentTarget;
					target.style.display = 'none';
					target.nextElementSibling?.classList.remove('hidden');
				}}
			/>
		);
	}
	return <FallbackIcon label={symbol.charAt(0)} className={className} />;
};

const MemoizedChainIcon = memo(ChainIcon);
const MemoizedTokenIcon = memo(TokenIcon);

export { MemoizedChainIcon as ChainIcon, MemoizedTokenIcon as TokenIcon };
