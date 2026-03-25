import type {
	ValidationError,
	ValidationResult,
	OrderFormValues,
} from './types';

export function validateSize(
	size: number,
	szDecimals: number,
): ValidationError | null {
	if (size <= 0) {
		return { field: 'size', message: 'Size must be greater than 0' };
	}
	const factor = 10 ** szDecimals;
	const rounded = Math.round(size * factor) / factor;
	if (Math.abs(size - rounded) > Number.EPSILON) {
		return {
			field: 'size',
			message: `Size precision exceeds ${szDecimals} decimals`,
		};
	}
	return null;
}

export function validateLimitPrice(
	price: number,
	markPrice: number,
	side: 'long' | 'short',
): ValidationError | null {
	if (price <= 0) {
		return {
			field: 'limitPrice',
			message: 'Limit price must be greater than 0',
		};
	}
	if (side === 'long' && price > markPrice * 1.1) {
		return {
			field: 'limitPrice',
			message: 'Limit buy price is more than 10% above mark price',
		};
	}
	if (side === 'short' && price < markPrice * 0.9) {
		return {
			field: 'limitPrice',
			message: 'Limit sell price is more than 10% below mark price',
		};
	}
	return null;
}

export function validateMargin(
	orderValue: number,
	leverage: number,
	available: number,
): ValidationError | null {
	if (leverage <= 0) return null;
	const required = orderValue / leverage;
	if (required > available) {
		return {
			field: 'margin',
			message: `Insufficient margin. Required: $${required.toFixed(2)}, Available: $${available.toFixed(2)}`,
		};
	}
	return null;
}

export function validateReduceOnly(
	size: number,
	positionSize: number,
	positionSide: 'LONG' | 'SHORT' | null,
	orderSide: 'long' | 'short',
): ValidationError | null {
	if (!positionSide || positionSize <= 0) {
		return {
			field: 'reduceOnly',
			message: 'No open position to reduce',
		};
	}
	const isClosing =
		(positionSide === 'LONG' && orderSide === 'short') ||
		(positionSide === 'SHORT' && orderSide === 'long');
	if (!isClosing) {
		return {
			field: 'reduceOnly',
			message: `Reduce-only requires ${positionSide === 'LONG' ? 'Sell/Short' : 'Buy/Long'} to close position`,
		};
	}
	if (size > positionSize) {
		return {
			field: 'reduceOnly',
			message: `Reduce-only size (${size}) exceeds position size (${positionSize})`,
		};
	}
	return null;
}

export function validateTpPrice(
	tpPrice: number,
	entryPrice: number,
	side: 'long' | 'short',
): ValidationError | null {
	if (tpPrice <= 0) {
		return {
			field: 'tpPrice',
			message: 'Take profit price must be greater than 0',
		};
	}
	if (side === 'long' && tpPrice <= entryPrice) {
		return {
			field: 'tpPrice',
			message: 'Take profit must be above entry price for long positions',
		};
	}
	if (side === 'short' && tpPrice >= entryPrice) {
		return {
			field: 'tpPrice',
			message: 'Take profit must be below entry price for short positions',
		};
	}
	return null;
}

export function validateSlPrice(
	slPrice: number,
	entryPrice: number,
	side: 'long' | 'short',
): ValidationError | null {
	if (slPrice <= 0) {
		return {
			field: 'slPrice',
			message: 'Stop loss price must be greater than 0',
		};
	}
	if (side === 'long' && slPrice >= entryPrice) {
		return {
			field: 'slPrice',
			message: 'Stop loss must be below entry price for long positions',
		};
	}
	if (side === 'short' && slPrice <= entryPrice) {
		return {
			field: 'slPrice',
			message: 'Stop loss must be above entry price for short positions',
		};
	}
	return null;
}

export function validateOrderForm(values: OrderFormValues): ValidationResult {
	const errors: ValidationError[] = [];

	const sizeError = validateSize(values.size, values.szDecimals);
	if (sizeError) errors.push(sizeError);

	if (values.type === 'limit') {
		const priceError = validateLimitPrice(
			values.limitPrice,
			values.markPrice,
			values.side,
		);
		if (priceError) errors.push(priceError);
	}

	if (!values.reduceOnly) {
		const marginError = validateMargin(
			values.size *
				(values.type === 'market' ? values.markPrice : values.limitPrice),
			values.leverage,
			values.availableMargin,
		);
		if (marginError) errors.push(marginError);
	}

	if (values.reduceOnly) {
		const reduceError = validateReduceOnly(
			values.size,
			values.currentPositionSize,
			values.currentPositionSide,
			values.side,
		);
		if (reduceError) errors.push(reduceError);
	}

	if (values.tpslEnabled) {
		const effectiveEntry =
			values.type === 'market' ? values.markPrice : values.limitPrice;

		if (values.tpPrice > 0) {
			const tpError = validateTpPrice(
				values.tpPrice,
				effectiveEntry,
				values.side,
			);
			if (tpError) errors.push(tpError);
		}

		if (values.slPrice > 0) {
			const slError = validateSlPrice(
				values.slPrice,
				effectiveEntry,
				values.side,
			);
			if (slError) errors.push(slError);
		}
	}

	return { valid: errors.length === 0, errors };
}
