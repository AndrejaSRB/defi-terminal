export interface HlTrade {
	coin: string;
	side: 'B' | 'A';
	px: string;
	sz: string;
	time: number;
	hash: `0x${string}`;
	tid: number;
	users: string[];
}
