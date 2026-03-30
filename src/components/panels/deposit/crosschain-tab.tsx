import { memo, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { ChainIcon, TokenIcon } from './chain-token-icons';
import { ExecutionStepper } from './execution-stepper';
import { useBridgeQuote } from './hooks/use-bridge-quote';
import { useBridgeExecute } from './hooks/use-bridge-execute';

const CrosschainTab = ({ onSuccess }: { onSuccess: () => void }) => {
	const walletAddress = useAtomValue(walletAddressAtom);
	const quote = useBridgeQuote();
	const execution = useBridgeExecute();

	// When bridge succeeds, switch to deposit tab
	useEffect(() => {
		if (execution.status === 'success') {
			onSuccess();
		}
	}, [execution.status, onSuccess]);

	const handleExecute = useCallback(async () => {
		if (
			!quote.lifiQuote ||
			!walletAddress ||
			!quote.selectedToken ||
			!quote.requiredChainId
		)
			return;

		await execution.execute({
			lifiQuote: quote.lifiQuote,
			walletAddress,
			selectedToken: quote.selectedToken,
			requiredChainId: quote.requiredChainId,
			depositConfig: quote.depositConfig,
		});
	}, [quote, walletAddress, execution, onSuccess]);

	// Execution/success view
	if (execution.status === 'executing' || execution.status === 'success') {
		return (
			<div className="space-y-4">
				<div className="text-center">
					<p className="text-sm font-medium text-foreground">
						{execution.status === 'success'
							? 'Bridge Complete'
							: `Bridging ${execution.tokenSymbol} to ${execution.destChainName}`}
					</p>
					{execution.status === 'executing' && (
						<p className="text-xs text-muted-foreground">
							Please do not close this window
						</p>
					)}
				</div>

				<ExecutionStepper steps={execution.steps} />

				{execution.status === 'success' && (
					<p className="text-center text-xs text-muted-foreground">
						Switch to the Deposit tab to deposit{' '}
						{quote.depositConfig.tokenSymbol}.
					</p>
				)}
			</div>
		);
	}

	// Form view
	return (
		<div className="space-y-4">
			{/* From section */}
			<div className="space-y-2">
				<span className="text-xs font-medium text-muted-foreground">From</span>
				<div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
					<div className="flex gap-2">
						{quote.isLoadingTokens ? (
							<>
								<Skeleton className="h-9 flex-1" />
								<Skeleton className="h-9 flex-1" />
							</>
						) : (
							<>
								<Select
									value={quote.selectedNetwork}
									onValueChange={quote.setSelectedNetwork}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Chain" />
									</SelectTrigger>
									<SelectContent>
										{quote.chainOptions.map((chain) => (
											<SelectItem key={chain.id} value={chain.id}>
												<div className="flex items-center gap-2">
													<ChainIcon network={chain.id} />
													<span>{chain.name}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={quote.effectiveTokenKey}
									onValueChange={quote.setSelectedTokenKey}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Token" />
									</SelectTrigger>
									<SelectContent>
										{quote.availableTokens.map((token) => {
											const key = `${token.symbol}:${token.tokenAddress}`;
											return (
												<SelectItem key={key} value={key}>
													<div className="flex items-center gap-2">
														<TokenIcon
															logo={token.logo}
															symbol={token.symbol}
														/>
														<span>{token.symbol}</span>
														<span className="text-muted-foreground">
															${token.usdValue.toFixed(2)}
														</span>
													</div>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</>
						)}
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<NumberInput
								value={quote.amount}
								onValueChange={quote.setAmount}
								placeholder="0.00"
								maxDecimals={6}
								className="flex-1"
							/>
							<Button
								size="sm"
								variant="secondary"
								onClick={quote.handleMaxClick}
								className="text-xs"
							>
								MAX
							</Button>
						</div>
						{quote.selectedToken && (
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>
									Balance: {quote.selectedToken.balance.toLocaleString()}{' '}
									{quote.selectedToken.symbol}
								</span>
								{quote.amountError && (
									<span className="text-red-400">{quote.amountError}</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Arrow */}
			<div className="flex justify-center">
				<div className="flex size-8 items-center justify-center rounded-full border border-border bg-card">
					<ArrowDown className="size-4 text-muted-foreground" />
				</div>
			</div>

			{/* To section */}
			<div className="space-y-2">
				<span className="text-xs font-medium text-muted-foreground">To</span>
				<div className="rounded-lg border border-border bg-muted/20 p-3">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-foreground">
								{quote.destChainName}
							</p>
							<p className="text-xs text-muted-foreground">
								{quote.depositConfig.tokenSymbol}
							</p>
						</div>
						{quote.isLoadingQuote ? (
							<Skeleton className="h-5 w-24" />
						) : quote.lifiQuote ? (
							<p className="text-sm font-medium text-foreground">
								~
								{(
									Number(quote.lifiQuote.estimate.toAmount) /
									10 ** quote.depositConfig.tokenDecimals
								).toFixed(2)}{' '}
								{quote.depositConfig.tokenSymbol}
							</p>
						) : (
							<p className="text-sm text-muted-foreground">--</p>
						)}
					</div>
				</div>
			</div>

			{/* Quote details */}
			{quote.lifiQuote && (
				<div className="space-y-1 rounded-lg border border-border bg-muted/10 p-3 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Bridge</span>
						<span className="text-foreground">
							{quote.lifiQuote.toolDetails.name}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Est. time</span>
						<span className="text-foreground">
							~{Math.ceil(quote.lifiQuote.estimate.executionDuration / 60)} min
						</span>
					</div>
					{quote.lifiQuote.estimate.feeCosts.map((fee) => (
						<div key={fee.name} className="flex justify-between">
							<span className="text-muted-foreground">{fee.name}</span>
							<span className="text-foreground">${fee.amountUSD}</span>
						</div>
					))}
					{quote.isQuoteCountdownRunning && (
						<div className="flex justify-between border-t border-border/50 pt-1">
							<span className="text-muted-foreground">Quote refreshes in</span>
							<span className="font-mono text-foreground">
								{quote.quoteSecondsLeft}s
							</span>
						</div>
					)}
				</div>
			)}

			{/* Action button */}
			{quote.needsChainSwitch ? (
				<Button className="w-full" onClick={quote.handleSwitchChain}>
					Switch to{' '}
					{quote.chainOptions.find(
						(chain) => chain.chainId === quote.requiredChainId,
					)?.name ?? 'correct network'}
				</Button>
			) : (
				<Button
					className="w-full"
					disabled={
						!quote.isValidAmount || !quote.lifiQuote || quote.isLoadingQuote
					}
					onClick={handleExecute}
				>
					{!quote.amount || Number(quote.amount) === 0
						? 'Enter Amount'
						: quote.amountError
							? quote.amountError
							: quote.isLoadingQuote
								? 'Getting Route...'
								: `Bridge to ${quote.destChainName}`}
				</Button>
			)}
		</div>
	);
};

export default memo(CrosschainTab);
