export type L2BookEvent = {
	coin: string;
	time: number;
	levels: [
		{ px: string; sz: string; n: number }[],
		{ px: string; sz: string; n: number }[],
	];
	spread?: string | undefined;
};
