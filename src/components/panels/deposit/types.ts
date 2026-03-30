// ── Execution Steps ──

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface ExecutionStep {
	id: string;
	label: string;
	description: string;
	status: StepStatus;
}
