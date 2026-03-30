import { memo, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { useWalletTransaction } from '@/hooks/use-wallet-transaction';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import { classifyTxError } from '@/lib/tx-errors';
import { buildDepositTx } from '@/services/hyperliquid/deposit';
import { getChainName } from '@/services/chains/config';
import { useDepositBalance } from './hooks/use-deposit-balance';

const DepositTab = () => {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { send: sendTransaction } = useWalletTransaction();
	const { isOnChain, switchChain } = useWalletChain();
	const {
		balance,
		isLoading: isLoadingBalance,
		tokenSymbol,
		chainId,
	} = useDepositBalance();

	const { depositConfig } = normalizer;
	const chainName = getChainName(chainId);

	const [amount, setAmount] = useState('');
	const [isDepositing, setIsDepositing] = useState(false);

	const parsedAmount = Number(amount);
	const isValidAmount =
		parsedAmount >= depositConfig.minDeposit && parsedAmount <= balance;
	const receiveAmount = parsedAmount > 0 ? parsedAmount - depositConfig.fee : 0;
	const needsChainSwitch = !isOnChain(chainId);

	const amountError =
		parsedAmount > 0 && parsedAmount > balance
			? 'Insufficient balance'
			: parsedAmount > 0 && parsedAmount < depositConfig.minDeposit
				? `Minimum deposit is $${depositConfig.minDeposit}`
				: null;

	const handleMaxClick = useCallback(() => {
		setAmount(balance.toString());
	}, [balance]);

	const handleSwitchChain = useCallback(async () => {
		try {
			await switchChain(chainId);
		} catch {
			toast.error('Failed to switch network');
		}
	}, [switchChain, chainId]);

	const handleDeposit = useCallback(async () => {
		if (!walletAddress || !isValidAmount) return;

		const amountWei = BigInt(
			Math.floor(parsedAmount * 10 ** depositConfig.tokenDecimals),
		);
		const tx = buildDepositTx(depositConfig, amountWei);

		setIsDepositing(true);
		try {
			if (!isOnChain(chainId)) {
				await switchChain(chainId);
			}

			const hash = await sendTransaction({
				to: tx.to,
				data: tx.data,
				value: BigInt(tx.value),
				chainId: tx.chainId,
			});

			toast.success('Deposit submitted', {
				description: `Tx: ${hash.slice(0, 10)}...`,
			});
			setAmount('');
		} catch (depositError) {
			const classified = classifyTxError(depositError);
			console.error('[Deposit] Error:', classified.type, depositError);
			toast.error(classified.message);
		} finally {
			setIsDepositing(false);
		}
	}, [
		walletAddress,
		isValidAmount,
		parsedAmount,
		depositConfig,
		chainId,
		isOnChain,
		switchChain,
		sendTransaction,
	]);

	return (
		<div className="space-y-4">
			{/* Balance display */}
			<div className="rounded-lg border border-border bg-muted/20 p-3">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						{tokenSymbol} on {chainName}
					</span>
					<span className="text-sm font-medium text-foreground">
						{isLoadingBalance
							? '...'
							: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
					</span>
				</div>
			</div>

			{/* Amount input */}
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<NumberInput
						value={amount}
						onValueChange={setAmount}
						placeholder="0.00"
						maxDecimals={2}
						className="flex-1"
					/>
					<Button
						size="sm"
						variant="secondary"
						onClick={handleMaxClick}
						className="text-xs"
					>
						MAX
					</Button>
				</div>
				{amountError && <p className="text-xs text-red-400">{amountError}</p>}
			</div>

			{/* Fee info */}
			{parsedAmount > 0 && !amountError && (
				<div className="space-y-1 rounded-lg border border-border bg-muted/10 p-3 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							{normalizer.name} bridge fee
						</span>
						<span className="text-foreground">
							${depositConfig.fee.toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">You receive</span>
						<span className="font-medium text-foreground">
							{receiveAmount.toFixed(2)} {tokenSymbol}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Est. time</span>
						<span className="text-foreground">
							{depositConfig.estimatedTime}
						</span>
					</div>
				</div>
			)}

			{/* Action button */}
			{needsChainSwitch ? (
				<Button className="w-full" onClick={handleSwitchChain}>
					Switch to {chainName}
				</Button>
			) : (
				<Button
					className="w-full"
					disabled={!isValidAmount || isDepositing}
					onClick={handleDeposit}
				>
					{isDepositing
						? 'Depositing...'
						: !amount || parsedAmount === 0
							? 'Enter Amount'
							: amountError
								? amountError
								: `Deposit ${parsedAmount} ${tokenSymbol}`}
				</Button>
			)}

			{balance === 0 && !isLoadingBalance && walletAddress && (
				<p className="text-center text-xs text-muted-foreground">
					No {tokenSymbol} on {chainName}. Use the Cross-Chain tab to bridge
					funds.
				</p>
			)}
		</div>
	);
};

export default memo(DepositTab);
