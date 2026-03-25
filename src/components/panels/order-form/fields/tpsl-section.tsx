import { memo, useCallback, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface TpslSectionProps {
	enabled: boolean;
	onToggle: () => void;
	children: ReactNode;
}

export const TpslSection = memo(function TpslSection({
	enabled,
	onToggle,
	children,
}: TpslSectionProps) {
	const handleChange = useCallback(() => {
		onToggle();
	}, [onToggle]);

	return (
		<div className="space-y-2">
			<label className="flex cursor-pointer items-center gap-2 text-xs">
				<Checkbox checked={enabled} onCheckedChange={handleChange} />
				<span className="text-muted-foreground">Take Profit / Stop Loss</span>
			</label>
			{enabled && <div className="space-y-2">{children}</div>}
		</div>
	);
});
