import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
	icon: ReactNode;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
				{icon}
			</div>
			<div className="space-y-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			{action && (
				<Button size="sm" onClick={action.onClick}>
					{action.label}
				</Button>
			)}
		</div>
	);
}
