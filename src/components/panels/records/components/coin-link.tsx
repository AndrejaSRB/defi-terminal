import { useCallback } from 'react';
import { useNavigateToken } from '@/hooks/use-navigate-token';

interface CoinLinkProps {
	coin: string;
	displayName: string;
	dexName?: string | null;
}

export function CoinLink({ coin, displayName, dexName }: CoinLinkProps) {
	const navigateToToken = useNavigateToken();

	const handleClick = useCallback(() => {
		navigateToToken(coin);
	}, [coin, navigateToToken]);

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
