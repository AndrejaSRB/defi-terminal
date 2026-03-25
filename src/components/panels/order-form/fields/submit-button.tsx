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
		| 'enter-size';
	side: 'long' | 'short';
	onClick: () => void;
}

const LABELS: Record<SubmitButtonProps['state'], string> = {
	connect: 'Connect Wallet',
	deposit: 'Deposit',
	'enter-size': 'Enter Size',
	'place-trade': 'Place Trade',
	'not-enough-margin': 'Not Enough Margin',
};

export const SubmitButton = memo(function SubmitButton({
	state,
	side,
	onClick,
}: SubmitButtonProps) {
	const { login } = useAuth();
	const isDisabled = state === 'not-enough-margin' || state === 'enter-size';
	const isLong = side === 'long';

	const handleClick = useCallback(() => {
		if (state === 'connect') {
			login();
			return;
		}
		onClick();
	}, [state, login, onClick]);

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
			{LABELS[state]}
		</Button>
	);
});
