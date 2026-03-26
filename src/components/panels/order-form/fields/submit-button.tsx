import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BUY_BG, SELL_BG } from '@/lib/colors';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface SubmitButtonProps {
	state: string;
	label: string;
	side: 'long' | 'short';
	isSubmitting: boolean;
	onClick: () => void;
}

const DISABLED_STATES = new Set([
	'not-enough-margin',
	'enter-size',
	'no-position',
]);

export const SubmitButton = memo(function SubmitButton({
	state,
	label,
	side,
	isSubmitting,
	onClick,
}: SubmitButtonProps) {
	const { login } = useAuth();
	const isDisabled = DISABLED_STATES.has(state) || isSubmitting;
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
				!isDisabled && isLong && BUY_BG,
				!isDisabled && !isLong && SELL_BG,
			)}
		>
			{label}
		</Button>
	);
});
