export type ClearinghouseState = {
	marginSummary: {
		accountValue: string;
		totalNtlPos: string;
		totalRawUsd: string;
		totalMarginUsed: string;
	};
	crossMarginSummary: {
		accountValue: string;
		totalNtlPos: string;
		totalRawUsd: string;
		totalMarginUsed: string;
	};
	crossMaintenanceMarginUsed: string;
	withdrawable: string;
	assetPositions: {
		type: 'oneWay';
		position: {
			coin: string;
			szi: string;
			leverage:
				| { type: 'isolated'; value: number; rawUsd: string }
				| { type: 'cross'; value: number };
			entryPx: string;
			positionValue: string;
			unrealizedPnl: string;
			returnOnEquity: string;
			liquidationPx: string | null;
			marginUsed: string;
			maxLeverage: number;
			cumFunding: {
				allTime: string;
				sinceOpen: string;
				sinceChange: string;
			};
		};
	}[];
	time: number;
};

export type AllDexsClearinghouseState = {
	user: string;
	clearinghouseStates: [string, ClearinghouseState][];
};
