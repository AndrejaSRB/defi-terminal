import { useAtomValue, useSetAtom } from 'jotai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { activeRecordsTabAtom } from '@/atoms/ui/records-tab';
import { userPositionsCountAtom } from '@/atoms/user/positions';
import { userOpenOrdersCountAtom } from '@/atoms/user/orders';
import { userBalancesCountAtom } from '@/atoms/user/balances';
import { BalancesContent } from './balances/balances-content';
import { PositionsContent } from './positions/positions-content';
import { OrdersContent } from './orders/orders-content';
import { FillsContent } from './fills/fills-content';
import { FundingsContent } from './fundings/fundings-content';
import { OrderHistoryContent } from './order-history/order-history-content';

export function RecordsPanel() {
	const posCount = useAtomValue(userPositionsCountAtom);
	const orderCount = useAtomValue(userOpenOrdersCountAtom);
	const balanceCount = useAtomValue(userBalancesCountAtom);
	const setActiveTab = useSetAtom(activeRecordsTabAtom);

	return (
		<Tabs
			defaultValue="positions"
			className="flex h-full flex-col gap-0"
			onValueChange={setActiveTab}
		>
			<div className="relative shrink-0">
				<TabsList
					variant="line"
					className="no-scrollbar flex h-8 w-full flex-nowrap justify-start overflow-x-auto overscroll-x-contain rounded-none px-2 [touch-action:pan-x] [&>*]:flex-none"
				>
					<TabsTrigger value="balances" className="text-xs">
						Balances{balanceCount > 0 ? ` (${balanceCount})` : ''}
					</TabsTrigger>
					<TabsTrigger value="positions" className="text-xs">
						Positions{posCount > 0 ? ` (${posCount})` : ''}
					</TabsTrigger>
					<TabsTrigger value="orders" className="text-xs">
						Open Orders{orderCount > 0 ? ` (${orderCount})` : ''}
					</TabsTrigger>
					<TabsTrigger value="history" className="text-xs">
						Trade History
					</TabsTrigger>
					<TabsTrigger value="order-history" className="text-xs">
						Order History
					</TabsTrigger>
					<TabsTrigger value="funding" className="text-xs">
						Funding History
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
				<BalancesContent />
			</TabsContent>
			<TabsContent value="positions" className="flex-1 overflow-auto">
				<PositionsContent />
			</TabsContent>
			<TabsContent value="orders" className="flex-1 overflow-auto">
				<OrdersContent />
			</TabsContent>
			<TabsContent value="history" className="flex-1 overflow-auto">
				<FillsContent />
			</TabsContent>
			<TabsContent value="order-history" className="flex-1 overflow-auto">
				<OrderHistoryContent />
			</TabsContent>
			<TabsContent value="funding" className="flex-1 overflow-auto">
				<FundingsContent />
			</TabsContent>
		</Tabs>
	);
}
