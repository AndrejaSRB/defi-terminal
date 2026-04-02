import { memo, useCallback, useMemo } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenIcon } from '@/components/panels/deposit/chain-token-icons';
import type { ChainOption } from './hooks/use-widget-tokens';
import type { WalletTokenBalance } from '@/services/lifi/balances';

interface SourcePanelProps {
	chainOptions: ChainOption[];
	availableTokens: WalletTokenBalance[];
	selectedChainId: number | null;
	effectiveTokenKey: string;
	selectedToken: WalletTokenBalance | null;
	amount: string;
	amountError: string | null;
	isLoading: boolean;
	onChainChange: (chainId: number) => void;
	onTokenChange: (tokenKey: string) => void;
	onAmountChange: (amount: string) => void;
	onMaxClick: () => void;
}

const NUMERIC_REGEX = /^\d*\.?\d*$/;

function countDecimals(value: string): number {
	const dotIndex = value.indexOf('.');
	if (dotIndex === -1) return 0;
	return value.length - dotIndex - 1;
}

function amountFontSize(value: string): string {
	const decimals = countDecimals(value);
	if (decimals > 10) return 'text-base';
	if (decimals > 6) return 'text-xl';
	return 'text-3xl';
}

function computeUsdValue(
	token: WalletTokenBalance | null,
	amount: string,
): string {
	if (!token || !amount || Number(amount) === 0) return '';
	const value = Number(amount) * token.priceUSD;
	return `~$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SourcePanel = ({
	chainOptions,
	availableTokens,
	selectedChainId,
	effectiveTokenKey,
	selectedToken,
	amount,
	amountError,
	isLoading,
	onChainChange,
	onTokenChange,
	onAmountChange,
	onMaxClick,
}: SourcePanelProps) => {
	const usdValue = useMemo(
		() => computeUsdValue(selectedToken, amount),
		[selectedToken, amount],
	);

	const handleInput = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const raw = event.target.value;
			if (raw === '' || NUMERIC_REGEX.test(raw)) {
				if (raw.includes('.')) {
					const decimals = raw.split('.')[1];
					if (decimals && decimals.length > (selectedToken?.decimals ?? 6))
						return;
				}
				onAmountChange(raw);
			}
		},
		[onAmountChange, selectedToken?.decimals],
	);

	const handleChainSelect = useCallback(
		(value: string) => onChainChange(Number(value)),
		[onChainChange],
	);

	if (isLoading) {
		return (
			<div className="rounded-xl border border-border bg-muted/20 p-4">
				<span className="text-xs font-medium text-muted-foreground">From</span>
				<div className="mt-3 flex gap-2">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-32" />
				</div>
				<Skeleton className="mt-2 h-4 w-20" />
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border bg-muted/20 p-4">
			{/* Header: label + chain selector */}
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-muted-foreground">From</span>
				<Select
					value={selectedChainId?.toString() ?? ''}
					onValueChange={handleChainSelect}
				>
					<SelectTrigger className="h-7 w-auto gap-1.5 rounded-full border-border/50 bg-muted/40 px-2.5 text-xs">
						<SelectValue placeholder="Chain" />
					</SelectTrigger>
					<SelectContent>
						{chainOptions.map((chain) => (
							<SelectItem key={chain.chainId} value={chain.chainId.toString()}>
								{chain.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Amount + token selector */}
			<div className="mt-3 flex items-center gap-3">
				<input
					type="text"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0"
					value={amount}
					onChange={handleInput}
					className={`min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 ${amountFontSize(amount)}`}
				/>
				<Select value={effectiveTokenKey} onValueChange={onTokenChange}>
					<SelectTrigger className="h-9 w-auto shrink-0 gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 text-sm font-medium">
						<SelectValue placeholder="Token" />
					</SelectTrigger>
					<SelectContent>
						{availableTokens.map((token) => {
							const tokenKey = `${token.symbol}:${token.address}`;
							return (
								<SelectItem key={tokenKey} value={tokenKey}>
									<TokenIcon logo={token.logoURI} symbol={token.symbol} />
									<span>{token.symbol}</span>
									<span className="text-muted-foreground">
										${token.usdValue.toFixed(2)}
									</span>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>

			{/* USD value + balance row */}
			<div className="mt-2 flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{usdValue || '\u00A0'}
				</span>
				{selectedToken && (
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span>
							{selectedToken.balance.toLocaleString()} {selectedToken.symbol}
						</span>
						<button
							type="button"
							onClick={onMaxClick}
							className="rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary transition-colors hover:bg-primary/20"
						>
							Max
						</button>
					</div>
				)}
			</div>
			{amountError && (
				<p className="mt-1 text-right text-xs text-destructive">
					{amountError}
				</p>
			)}
		</div>
	);
};

export default memo(SourcePanel);
