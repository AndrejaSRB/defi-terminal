import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderBookContent } from './orderbook-content';
import { TradesContent } from './trades-content';

export function OrderbookPanel() {
	return (
		<Tabs defaultValue="orderbook" className="flex h-full flex-col gap-0">
			<TabsList
				variant="line"
				className="h-8 w-full shrink-0 rounded-none border-b border-border px-2"
			>
				<TabsTrigger value="orderbook" className="text-xs">
					Order Book
				</TabsTrigger>
				<TabsTrigger value="trades" className="text-xs">
					Trades
				</TabsTrigger>
			</TabsList>
			<TabsContent value="orderbook" className="flex-1 overflow-hidden">
				<OrderBookContent />
			</TabsContent>
			<TabsContent value="trades" className="flex-1 overflow-hidden">
				<TradesContent />
			</TabsContent>
		</Tabs>
	);
}
