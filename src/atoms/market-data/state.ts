export interface MarketDataState<T> {
	status: 'idle' | 'loading' | 'live';
	data: T;
	error: string | null;
}
