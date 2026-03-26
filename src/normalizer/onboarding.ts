export type SignTransactionFn = (data: unknown) => Promise<string>;

export interface OnboardingStep {
	id: string;
	label: string;
	status: 'pending' | 'ready';
}

export interface OnboardingParams {
	walletAddress: string;
	totalRawUsd: number;
}

export interface ExecuteStepParams {
	stepId: string;
	walletAddress: string;
	sign: SignTransactionFn;
}

export interface DexOnboarding {
	/** Ordered steps — first pending step blocks trading */
	getSteps: (params: OnboardingParams) => OnboardingStep[];

	/** Execute a pending step (create agent, redirect to deposit, etc.) */
	executeStep: (params: ExecuteStepParams) => Promise<void>;

	/** Quick check if all steps are ready */
	isReadyToTrade: (params: OnboardingParams) => boolean;
}
