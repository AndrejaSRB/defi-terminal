import { Button } from '@/components/ui/button';

export function TopBar() {
	return (
		<div className="flex h-10 items-center justify-between border-b border-border px-3">
			<div className="flex items-center gap-4">
				<span className="text-sm font-bold">Terminal</span>
			</div>

			<div className="flex items-center gap-2">
				<Button size="sm">Connect</Button>
			</div>
		</div>
	);
}
