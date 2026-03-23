import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RecordsPanel() {
	return (
		<Tabs defaultValue="balances" className="flex h-full flex-col gap-0">
			<div className="relative shrink-0">
				<TabsList variant="line" className="h-8 rounded-none px-2">
					<TabsTrigger value="balances" className="text-xs">
						Balances
					</TabsTrigger>
					<TabsTrigger value="positions" className="text-xs">
						Positions
					</TabsTrigger>
					<TabsTrigger value="orders" className="text-xs">
						Open Orders
					</TabsTrigger>
					<TabsTrigger value="history" className="text-xs">
						Trade History
					</TabsTrigger>
				</TabsList>
				<div
					className="absolute bottom-0 left-0 h-px w-full bg-border"
					style={{
						maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
						WebkitMaskImage:
							'linear-gradient(to right, black 30%, transparent 100%)',
					}}
				/>
			</div>
			<TabsContent value="balances" className="flex-1 overflow-auto">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Balances
				</div>
			</TabsContent>
			<TabsContent value="positions" className="flex-1 overflow-auto">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Positions
				</div>
			</TabsContent>
			<TabsContent value="orders" className="flex-1 overflow-auto">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Open Orders
				</div>
			</TabsContent>
			<TabsContent value="history" className="flex-1 overflow-auto">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Trade History
				</div>
			</TabsContent>
		</Tabs>
	);
}
