import { Wallet, LogOut, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

export function TopBar() {
	const {
		isReady,
		isAuthenticated,
		walletAddress,
		shortAddress,
		login,
		logout,
	} = useAuth();

	const copyAddress = () => {
		if (walletAddress) {
			navigator.clipboard.writeText(walletAddress);
			toast.success('Address copied');
		}
	};

	return (
		<div className="flex h-10 items-center justify-between border-b border-border px-3">
			<div className="flex items-center gap-4">
				<span className="text-sm font-bold">Terminal</span>
			</div>

			<div className="flex items-center gap-2">
				{!isReady ? (
					<Button size="sm" disabled>
						Loading...
					</Button>
				) : !isAuthenticated ? (
					<Button size="sm" onClick={login}>
						Connect
					</Button>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" variant="secondary" className="gap-1.5">
								<Wallet className="size-3.5" />
								{shortAddress}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-auto min-w-0">
							<DropdownMenuItem onClick={copyAddress}>
								<Copy className="mr-2 size-3.5" />
								Copy Address
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={logout}>
								<LogOut className="mr-2 size-3.5" />
								Disconnect
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
