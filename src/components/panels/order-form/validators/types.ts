export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

export interface OrderFormValues {
	side: 'long' | 'short';
	type: 'market' | 'limit';
	limitPrice: number;
	size: number;
	markPrice: number;
	availableMargin: number;
	leverage: number;
	reduceOnly: boolean;
	currentPositionSize: number;
	currentPositionSide: 'LONG' | 'SHORT' | null;
	szDecimals: number;
	maxLeverage: number;
	orderValue: number;
	tpslEnabled: boolean;
	tpPrice: number;
	slPrice: number;
}
