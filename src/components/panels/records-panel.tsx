import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RecordsPanel() {
	return (
		<Tabs defaultValue="balances" className="flex h-full flex-col gap-0">
			<TabsList
				variant="line"
				className="h-8 shrink-0 rounded-none border-b border-border px-2"
			>
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
