import type {
	ValidationError,
	ValidationResult,
	OrderFormValues,
} from './types';

const MIN_ORDER_VALUE = 10;

export function validateNaN(
	value: number,
	field: string,
	label: string,
): ValidationError | null {
	if (Number.isNaN(value) || !Number.isFinite(value)) {
		return { field, message: `${label} is not a valid number` };
	}
	return null;
}

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

export function validateMinOrderValue(
	orderValue: number,
): ValidationError | null {
	if (orderValue > 0 && orderValue < MIN_ORDER_VALUE) {
		return {
			field: 'orderValue',
			message: `Minimum order value is $${MIN_ORDER_VALUE}`,
		};
	}
	return null;
}

export function validateLeverage(
	leverage: number,
	maxLeverage: number,
): ValidationError | null {
	if (leverage <= 0 || !Number.isFinite(leverage)) {
		return { field: 'leverage', message: 'Leverage must be at least 1x' };
	}
	if (leverage > maxLeverage) {
		return {
			field: 'leverage',
			message: `Leverage cannot exceed ${maxLeverage}x`,
		};
	}
	return null;
}

export function validateLimitPrice(price: number): ValidationError | null {
	if (price <= 0) {
		return {
			field: 'limitPrice',
			message: 'Limit price must be greater than 0',
		};
	}
	// Server-side validation handles DEX-specific price caps.
	// No client-side cap — Extended and Hyperliquid have different limits.
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
			message: `Reduce-only size exceeds position size (${positionSize})`,
		};
	}
	return null;
}

export function validateTpPrice(tpPrice: number): ValidationError | null {
	const nanError = validateNaN(tpPrice, 'tpPrice', 'Take Profit price');
	if (nanError) return nanError;
	if (tpPrice <= 0) {
		return {
			field: 'tpPrice',
			message: 'Take Profit price must be greater than 0',
		};
	}
	// Direction validation (TP above/below entry) is DEX-specific
	// and handled server-side. No client-side check.
	return null;
}

export function validateSlPrice(slPrice: number): ValidationError | null {
	const nanError = validateNaN(slPrice, 'slPrice', 'Stop Loss price');
	if (nanError) return nanError;
	if (slPrice <= 0) {
		return {
			field: 'slPrice',
			message: 'Stop Loss price must be greater than 0',
		};
	}
	return null;
}

export function validateOrderForm(values: OrderFormValues): ValidationResult {
	const errors: ValidationError[] = [];

	// NaN checks
	const sizeNaN = validateNaN(values.size, 'size', 'Size');
	if (sizeNaN) {
		errors.push(sizeNaN);
		return { valid: false, errors };
	}

	// Size
	const sizeError = validateSize(values.size, values.szDecimals);
	if (sizeError) errors.push(sizeError);

	// Min order value
	const minValueError = validateMinOrderValue(values.orderValue);
	if (minValueError) errors.push(minValueError);

	// Leverage
	const leverageError = validateLeverage(values.leverage, values.maxLeverage);
	if (leverageError) errors.push(leverageError);

	// Limit price
	if (values.type === 'limit') {
		const nanError = validateNaN(
			values.limitPrice,
			'limitPrice',
			'Limit price',
		);
		if (nanError) {
			errors.push(nanError);
		} else {
			const priceError = validateLimitPrice(values.limitPrice);
			if (priceError) errors.push(priceError);
		}
	}

	// Margin (skip for reduce-only)
	if (!values.reduceOnly) {
		const marginError = validateMargin(
			values.orderValue,
			values.leverage,
			values.availableMargin,
		);
		if (marginError) errors.push(marginError);
	}

	// Reduce only
	if (values.reduceOnly) {
		const reduceError = validateReduceOnly(
			values.size,
			values.currentPositionSize,
			values.currentPositionSide,
			values.side,
		);
		if (reduceError) errors.push(reduceError);
	}

	// TP/SL
	if (values.tpslEnabled) {
		const hasTp = values.tpPrice > 0;
		const hasSl = values.slPrice > 0;

		if (!hasTp && !hasSl) {
			errors.push({
				field: 'tpsl',
				message: 'Set at least one: Take Profit or Stop Loss',
			});
		}

		if (hasTp) {
			const tpError = validateTpPrice(values.tpPrice);
			if (tpError) errors.push(tpError);
		}

		if (hasSl) {
			const slError = validateSlPrice(values.slPrice);
			if (slError) errors.push(slError);
		}

		// TP/SL cross-validation
		if (hasTp && hasSl) {
			if (values.side === 'long' && values.tpPrice <= values.slPrice) {
				errors.push({
					field: 'tpsl',
					message: 'Take Profit must be above Stop Loss for long positions',
				});
			}
			if (values.side === 'short' && values.tpPrice >= values.slPrice) {
				errors.push({
					field: 'tpsl',
					message: 'Take Profit must be below Stop Loss for short positions',
				});
			}
		}
	}

	return { valid: errors.length === 0, errors };
}
