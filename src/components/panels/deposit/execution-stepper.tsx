import { memo } from 'react';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionStep, StepStatus } from './types';

const CIRCLE_STYLES: Record<StepStatus, string> = {
	completed: 'border-green-500 text-green-400 bg-green-400/10',
	active: 'border-primary text-primary bg-primary/10',
	pending: 'border-border text-muted-foreground bg-muted/30',
	error: 'border-red-500 text-red-400 bg-red-400/10',
};

const LINE_STYLES: Record<string, string> = {
	'completed-completed': 'bg-green-500',
	'completed-active': 'bg-gradient-to-b from-green-500 to-primary',
	'active-pending': 'bg-gradient-to-b from-primary to-border',
	'completed-pending': 'bg-gradient-to-b from-green-500 to-border',
	'active-active': 'bg-primary',
	'pending-pending': 'bg-border',
	'completed-error': 'bg-gradient-to-b from-green-500 to-red-500',
	'active-error': 'bg-gradient-to-b from-primary to-red-500',
	'error-pending': 'bg-gradient-to-b from-red-500 to-border',
};

function getLineClass(topStatus: StepStatus, bottomStatus: StepStatus): string {
	return LINE_STYLES[`${topStatus}-${bottomStatus}`] ?? 'bg-border';
}

function StepIcon({ status }: { status: StepStatus }) {
	switch (status) {
		case 'completed':
			return <Check className="size-4" />;
		case 'active':
			return <Loader2 className="size-4 animate-spin" />;
		case 'error':
			return <AlertCircle className="size-4" />;
		default:
			return <Circle className="size-3" />;
	}
}

interface ExecutionStepperProps {
	steps: ExecutionStep[];
}

export const ExecutionStepper = memo(function ExecutionStepper({
	steps,
}: ExecutionStepperProps) {
	return (
		<div className="flex flex-col">
			{steps.map((step, index) => {
				const isLast = index === steps.length - 1;
				const nextStep = !isLast ? steps[index + 1] : null;

				return (
					<div key={step.id} className="flex items-start gap-3">
						{/* Left: circle + connecting line */}
						<div className="relative flex shrink-0 flex-col items-center self-stretch">
							<div
								className={cn(
									'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
									CIRCLE_STYLES[step.status],
								)}
							>
								<StepIcon status={step.status} />
							</div>
							{nextStep && (
								<div
									className={cn(
										'absolute top-8 bottom-0 w-0.5 transition-all duration-500',
										getLineClass(step.status, nextStep.status),
									)}
								/>
							)}
						</div>

						{/* Right: label + description */}
						<div
							className={cn('flex flex-col gap-0.5 pt-1', !isLast && 'pb-6')}
						>
							<p
								className={cn(
									'text-sm font-medium transition-colors duration-500',
									step.status === 'active' && 'text-primary',
									step.status === 'completed' && 'text-green-400',
									step.status === 'error' && 'text-red-400',
									step.status === 'pending' && 'text-muted-foreground',
								)}
							>
								{step.label}
							</p>
							<p className="text-xs text-muted-foreground">
								{step.description}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
});
