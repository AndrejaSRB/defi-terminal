import { memo } from 'react';

interface CloseAllButtonProps {
	hasPositions: boolean;
	disabled: boolean;
	onClick: () => void;
}

export const CloseAllButton = memo(function CloseAllButton({
	hasPositions,
	disabled,
	onClick,
}: CloseAllButtonProps) {
	if (!hasPositions) {
		return <span className="text-muted-foreground font-medium">Actions</span>;
	}

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className="font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
		>
			Close All
		</button>
	);
});
