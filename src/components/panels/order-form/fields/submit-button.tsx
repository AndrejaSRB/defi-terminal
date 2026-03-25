import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface SubmitButtonProps {
	state:
		| 'connect'
		| 'deposit'
		| 'place-trade'
		| 'not-enough-margin'
		| 'enter-size'
		| 'no-position';
	side: 'long' | 'short';
	token: string;
	onClick: () => void;
}

const LABELS: Record<string, string> = {
	connect: 'Connect Wallet',
	deposit: 'Deposit',
	'enter-size': 'Enter Size',
	'not-enough-margin': 'Not Enough Margin',
	'no-position': 'Reduce Only Too Large',
};

export const SubmitButton = memo(function SubmitButton({
	state,
	side,
	token,
	onClick,
}: SubmitButtonProps) {
	const { login } = useAuth();
	const isDisabled =
		state === 'not-enough-margin' ||
		state === 'enter-size' ||
		state === 'no-position';
	const isLong = side === 'long';

	const handleClick = useCallback(() => {
		if (state === 'connect') {
			login();
			return;
		}
		onClick();
	}, [state, login, onClick]);

	const label =
		state === 'place-trade'
			? `${isLong ? 'Buy' : 'Sell'} ${token}`
			: LABELS[state];

	return (
		<Button
			size="lg"
			disabled={isDisabled}
			onClick={handleClick}
			className={cn(
				'w-full text-sm font-semibold',
				!isDisabled &&
					isLong &&
					'bg-green-500/90 text-white hover:bg-green-500',
				!isDisabled && !isLong && 'bg-red-500/90 text-white hover:bg-red-500',
			)}
		>
			{label}
		</Button>
	);
});
