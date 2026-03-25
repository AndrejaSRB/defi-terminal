import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';

interface CoinLinkProps {
	coin: string;
	displayName: string;
	dexName?: string | null;
}

export function CoinLink({ coin, displayName, dexName }: CoinLinkProps) {
	const setActiveToken = useSetAtom(activeTokenAtom);

	const handleClick = useCallback(() => {
		setActiveToken(coin);
	}, [coin, setActiveToken]);

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				className="cursor-pointer font-bold uppercase text-foreground transition-colors hover:text-primary"
			>
				{displayName}
			</button>
			{dexName && (
				<span className="ml-1 text-[11px] text-muted-foreground">
					{dexName}
				</span>
			)}
		</>
	);
}
