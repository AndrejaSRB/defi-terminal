import { useAtomValue } from 'jotai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { PositionsContent } from './positions-content';

export function RecordsPanel() {
	const positions = useAtomValue(userPositionsAtom);
	const orders = useAtomValue(userOpenOrdersAtom);

	const posCount = positions.length;
	const orderCount = orders.length;

	return (
		<Tabs defaultValue="positions" className="flex h-full flex-col gap-0">
			<div className="relative shrink-0">
				<TabsList variant="line" className="h-8 rounded-none px-2">
					<TabsTrigger value="positions" className="text-xs">
						Positions{posCount > 0 ? ` (${posCount})` : ''}
					</TabsTrigger>
					<TabsTrigger value="orders" className="text-xs">
						Open Orders{orderCount > 0 ? ` (${orderCount})` : ''}
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
			<TabsContent value="positions" className="flex-1 overflow-auto">
				<PositionsContent />
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
