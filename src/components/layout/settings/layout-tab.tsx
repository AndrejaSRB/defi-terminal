import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	panelVisibilityAtom,
	PANEL_IDS,
	PANEL_LABELS,
	type PanelId,
} from '@/atoms/settings';
import { resetPanelLayoutAtom } from '@/atoms/user/panel-layout';

function PanelToggleCard({
	panelId,
	label,
	visible,
	isLastVisible,
	onToggle,
}: {
	panelId: PanelId;
	label: string;
	visible: boolean;
	isLastVisible: boolean;
	onToggle: (panelId: PanelId) => void;
}) {
	const disabled = visible && isLastVisible;

	const handleClick = useCallback(() => {
		if (!disabled) onToggle(panelId);
	}, [panelId, onToggle, disabled]);

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className={cn(
				'flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors',
				visible
					? 'border-primary bg-primary/10 text-foreground'
					: 'border-border bg-muted/30 text-muted-foreground',
				disabled && 'cursor-not-allowed opacity-50',
			)}
		>
			{visible ? (
				<Eye className="size-4 shrink-0 text-primary" />
			) : (
				<EyeOff className="size-4 shrink-0" />
			)}
			{label}
		</button>
	);
}

export function LayoutTab() {
	const [visibility, setVisibility] = useAtom(panelVisibilityAtom);
	const resetLayout = useSetAtom(resetPanelLayoutAtom);

	const visibleCount = Object.values(visibility).filter(Boolean).length;

	const handleToggle = useCallback(
		(panelId: PanelId) => {
			setVisibility((prev) => ({ ...prev, [panelId]: !prev[panelId] }));
		},
		[setVisibility],
	);

	const handleReset = useCallback(() => {
		setVisibility({
			chart: true,
			orderbook: true,
			orderForm: true,
			records: true,
			account: true,
		});
		resetLayout();
		toast.success('Layout reset to default');
	}, [setVisibility, resetLayout]);

	return (
		<div className="space-y-4">
			<p className="text-xs text-muted-foreground">
				Toggle which panels are visible in the terminal layout.
			</p>
			<div className="grid grid-cols-2 gap-2">
				{PANEL_IDS.map((panelId) => (
					<PanelToggleCard
						key={panelId}
						panelId={panelId}
						label={PANEL_LABELS[panelId]}
						visible={visibility[panelId]}
						isLastVisible={visibleCount === 1}
						onToggle={handleToggle}
					/>
				))}
			</div>

			<Button
				variant="secondary"
				size="sm"
				className="w-full gap-2"
				onClick={handleReset}
			>
				<RotateCcw className="size-3.5" />
				Fresh Start
			</Button>
		</div>
	);
}
