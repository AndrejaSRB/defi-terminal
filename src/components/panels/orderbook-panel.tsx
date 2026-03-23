import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function OrderbookPanel() {
	return (
		<Tabs defaultValue="orderbook" className="flex h-full flex-col gap-0">
			<TabsList
				variant="line"
				className="h-8 shrink-0 rounded-none border-b border-border px-2 w-full"
			>
				<TabsTrigger value="orderbook" className="text-xs">
					Order Book
				</TabsTrigger>
				<TabsTrigger value="trades" className="text-xs">
					Trades
				</TabsTrigger>
			</TabsList>
			<TabsContent value="orderbook" className="flex-1 overflow-hidden">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Order Book
				</div>
			</TabsContent>
			<TabsContent value="trades" className="flex-1 overflow-hidden">
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					Trades
				</div>
			</TabsContent>
		</Tabs>
	);
}
