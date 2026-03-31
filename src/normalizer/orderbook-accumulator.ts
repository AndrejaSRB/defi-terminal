import type { OrderBook, OrderBookLevel } from './types';

/**
 * Stateful orderbook accumulator for DEXes that send SNAPSHOT + DELTA updates.
 *
 * Generic — no DEX-specific wire format knowledge.
 * The normalizer provides a `feedOrderBook(raw, accumulator)` method
 * that translates wire format into `applySnapshot` / `applyDelta` calls.
 *
 * Supports buffering: WS messages are queued until the initial REST
 * snapshot is applied via `seed()`. This prevents race conditions where
 * deltas arrive before the snapshot.
 */
export class OrderBookAccumulator {
	private bids = new Map<string, number>();
	private asks = new Map<string, number>();
	private seeded = false;
	private buffer: unknown[] = [];

	/**
	 * Seed with a REST snapshot (domain OrderBook type).
	 * After seeding, any buffered WS messages are replayed via the
	 * provided `feed` function, then live mode begins.
	 */
	seed(
		book: OrderBook,
		feed: (raw: unknown, acc: OrderBookAccumulator) => void,
	): void {
		for (const level of book.bids) {
			this.bids.set(String(level.price), level.size);
		}
		for (const level of book.asks) {
			this.asks.set(String(level.price), level.size);
		}
		this.seeded = true;

		// Replay buffered deltas
		for (const raw of this.buffer) {
			feed(raw, this);
		}
		this.buffer = [];
	}

	/**
	 * Queue a raw WS message if not yet seeded.
	 * Returns true if the message was buffered (caller should skip processing).
	 */
	bufferIfNeeded(raw: unknown): boolean {
		if (!this.seeded) {
			this.buffer.push(raw);
			return true;
		}
		return false;
	}

	/**
	 * Replace entire book with a full snapshot.
	 */
	applySnapshot(bids: AccLevel[], asks: AccLevel[]): void {
		this.bids.clear();
		this.asks.clear();

		for (const level of bids) {
			this.bids.set(level.price, level.size);
		}
		for (const level of asks) {
			this.asks.set(level.price, level.size);
		}
	}

	/**
	 * Merge delta changes into the existing book.
	 */
	applyDelta(bids: AccLevel[], asks: AccLevel[]): void {
		for (const level of bids) {
			this.applyLevelDelta(this.bids, level);
		}
		for (const level of asks) {
			this.applyLevelDelta(this.asks, level);
		}
	}

	/**
	 * Return the current accumulated book as sorted OrderBook.
	 */
	getBook(): OrderBook {
		return {
			bids: this.sortLevels(this.bids, 'desc'),
			asks: this.sortLevels(this.asks, 'asc'),
			timestamp: Date.now(),
		};
	}

	private applyLevelDelta(side: Map<string, number>, level: AccLevel): void {
		if (level.size <= 0) {
			side.delete(level.price);
		} else {
			side.set(level.price, level.size);
		}
	}

	private sortLevels(
		map: Map<string, number>,
		order: 'asc' | 'desc',
	): OrderBookLevel[] {
		const levels: OrderBookLevel[] = [];
		for (const [priceStr, size] of map) {
			if (size > 0) {
				levels.push({ price: parseFloat(priceStr), size });
			}
		}

		return order === 'desc'
			? levels.sort((levelA, levelB) => levelB.price - levelA.price)
			: levels.sort((levelA, levelB) => levelA.price - levelB.price);
	}
}

/** Generic accumulated level — price as string key, size as number */
export interface AccLevel {
	price: string;
	size: number;
}
