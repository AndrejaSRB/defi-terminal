export interface HlCandle {
	t: number;
	T: number;
	s: string;
	i: string;
	o: string;
	c: string;
	h: string;
	l: string;
	v: string;
	n: number;
}

export type CandleInterval =
	| '1m'
	| '3m'
	| '5m'
	| '15m'
	| '30m'
	| '1h'
	| '2h'
	| '4h'
	| '8h'
	| '12h'
	| '1d'
	| '3d'
	| '1w'
	| '1M';
