import type {
	IChartWidgetApi,
	EntityId,
} from '@charting_library/charting_library';
import type { Position, OpenOrder } from '@/normalizer/types';
import { cssVarToHex } from '@/lib/css-to-hex';

// ── Line style constants ──

const LINE_SOLID = 0;
const LINE_DOTTED = 1;
const LINE_DASHED = 2;

const COLOR_GREEN = '#22c55e';
const COLOR_RED = '#ef4444';
const COLOR_VIOLET = '#a78bfa';

interface LineConfig {
	price: number;
	text: string;
	color: string;
	style: number;
	width: number;
}

function buildOverrides(config: LineConfig): Record<string, unknown> {
	return {
		linecolor: config.color,
		linestyle: config.style,
		linewidth: config.width,
		showPrice: false,
		textcolor: config.color,
		fontsize: 11,
		bold: config.width > 1,
		horzLabelsAlign: 'left',
	};
}

function buildPrefixedOverrides(config: LineConfig): Record<string, unknown> {
	return {
		'linetoolhorzline.linecolor': config.color,
		'linetoolhorzline.linestyle': config.style,
		'linetoolhorzline.linewidth': config.width,
		'linetoolhorzline.showPrice': false,
		'linetoolhorzline.textcolor': config.color,
		'linetoolhorzline.fontsize': 11,
		'linetoolhorzline.bold': config.width > 1,
		'linetoolhorzline.horzLabelsAlign': 'left',
	};
}

// ── ChartLineManager ──

export class ChartLineManager {
	private lines = new Map<string, EntityId>();

	async syncPositions(
		chart: IChartWidgetApi,
		positions: Position[],
	): Promise<void> {
		const activeKeys = new Set<string>();
		const primary = cssVarToHex('--primary');

		for (const position of positions) {
			const coin = position.coin;
			const side = position.side;
			const entryPrice = parseFloat(position.entryPrice);

			// Entry line — uses theme primary color
			const entryKey = `pos:${coin}:entry`;
			activeKeys.add(entryKey);
			await this.upsertLine(chart, entryKey, {
				price: entryPrice,
				text: `${side} ${position.size} @ ${position.entryPrice}`,
				color: primary,
				style: LINE_SOLID,
				width: 2,
			});

			// Liquidation line
			if (position.liquidationPrice) {
				const liqPrice = parseFloat(position.liquidationPrice);
				if (liqPrice > 0) {
					const liqKey = `pos:${coin}:liq`;
					activeKeys.add(liqKey);
					await this.upsertLine(chart, liqKey, {
						price: liqPrice,
						text: `Liq @ ${position.liquidationPrice}`,
						color: COLOR_RED,
						style: LINE_DASHED,
						width: 1,
					});
				}
			}

			// TP/SL lines come from orders with isPositionTpsl — handled in syncOrders
		}

		this.removeStale(chart, 'pos:', activeKeys);
	}

	async syncOrders(chart: IChartWidgetApi, orders: OpenOrder[]): Promise<void> {
		const activeKeys = new Set<string>();

		for (const order of orders) {
			if (order.isPositionTpsl) {
				// Position TP/SL orders → draw as TP/SL lines
				const price = order.triggerPrice ?? order.price;
				const isTp =
					order.orderType === 'tp' || order.orderType === 'tp_market';
				const key = `tpsl:${order.id}`;
				activeKeys.add(key);

				await this.upsertLine(chart, key, {
					price,
					text: isTp ? `TP @ ${price}` : `SL @ ${price}`,
					color: isTp ? COLOR_GREEN : COLOR_RED,
					style: LINE_DASHED,
					width: 1,
				});
			} else {
				// Regular open orders
				const orderKey = `order:${order.id}`;
				activeKeys.add(orderKey);

				const isBuy = order.side === 'buy';
				const color = isBuy ? COLOR_VIOLET : COLOR_VIOLET;
				const sideLabel = isBuy ? 'Buy' : 'Sell';
				const typeLabel = this.formatOrderType(order.orderType);
				const price = order.triggerPrice ?? order.price;

				await this.upsertLine(chart, orderKey, {
					price,
					text: `${typeLabel} ${sideLabel} @ ${price}`,
					color,
					style: LINE_DOTTED,
					width: 1,
				});
			}
		}

		this.removeStale(chart, 'order:', activeKeys);
		this.removeStale(chart, 'tpsl:', activeKeys);
	}

	clearAll(chart: IChartWidgetApi): void {
		for (const [, entityId] of this.lines) {
			try {
				chart.removeEntity(entityId);
			} catch {
				// Entity may already be removed
			}
		}
		this.lines.clear();
		this.lineConfigs.clear();
	}

	// Track config per key for diff detection
	private lineConfigs = new Map<string, string>();

	private configFingerprint(config: LineConfig): string {
		return `${config.price}:${config.color}:${config.style}:${config.width}:${config.text}`;
	}

	private async upsertLine(
		chart: IChartWidgetApi,
		key: string,
		config: LineConfig,
	): Promise<void> {
		const existing = this.lines.get(key);
		const fingerprint = this.configFingerprint(config);

		// Skip if line exists with identical config
		if (existing && this.lineConfigs.get(key) === fingerprint) {
			return;
		}

		// Remove old line if it exists
		if (existing) {
			try {
				chart.removeEntity(existing);
			} catch {
				// Already removed
			}
			this.lines.delete(key);
			this.lineConfigs.delete(key);
		}

		try {
			const entityId = await chart.createShape(
				{ price: config.price, time: 0 },
				{
					shape: 'horizontal_line',
					text: config.text,
					lock: true,
					disableSelection: true,
					disableSave: true,
					showInObjectsTree: false,
					overrides: buildOverrides(config),
				},
			);
			// Also apply with prefixed keys via setProperties as fallback
			try {
				chart
					.getShapeById(entityId)
					.setProperties(buildPrefixedOverrides(config));
			} catch {
				// Ignore
			}
			this.lines.set(key, entityId);
			this.lineConfigs.set(key, fingerprint);
		} catch (error) {
			console.warn(`[ChartLines] Failed to create line "${key}":`, error);
		}
	}

	private removeStale(
		chart: IChartWidgetApi,
		prefix: string,
		activeKeys: Set<string>,
	): void {
		for (const [key, entityId] of this.lines) {
			if (key.startsWith(prefix) && !activeKeys.has(key)) {
				try {
					chart.removeEntity(entityId);
				} catch {
					// Already removed
				}
				this.lines.delete(key);
				this.lineConfigs.delete(key);
			}
		}
	}

	private formatOrderType(orderType: string): string {
		switch (orderType) {
			case 'limit':
				return 'Limit';
			case 'market':
				return 'Market';
			case 'tp_market':
			case 'tp':
				return 'TP';
			case 'sl_market':
			case 'sl':
				return 'SL';
			default:
				return orderType;
		}
	}
}
