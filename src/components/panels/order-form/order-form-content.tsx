import { useAtomValue } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { useOrderFormData } from './hooks/use-order-form-data';
import { useOrderFormActions } from './hooks/use-order-form-actions';
import { MarginModeButton } from './fields/margin-mode-button';
import { LeverageButton } from './fields/leverage-button';
import { OrderTypeTabs } from './fields/order-type-tabs';
import { SideToggle } from './fields/side-toggle';
import { PriceInput } from './fields/price-input';
import { AvailableInfo } from './fields/available-info';
import { SizeInput } from './fields/size-input';
import { SizeSlider } from './fields/size-slider';
import { ReduceOnlyCheckbox } from './fields/reduce-only-checkbox';
import { TpslSection } from './fields/tpsl-section';
import { TpInput } from './fields/tp-input';
import { SlInput } from './fields/sl-input';
import { SubmitButton } from './fields/submit-button';
import { OrderInfoFooter } from './fields/order-info-footer';
import { OrderFormSkeleton } from './order-form-skeleton';

export function OrderFormContent() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const data = useOrderFormData();
	const actions = useOrderFormActions();

	if (!data.isReady) {
		return <OrderFormSkeleton />;
	}

	return (
		<div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
			{/* Margin Mode + Leverage */}
			<div className="flex gap-2">
				{normalizer.hasMarginMode && <MarginModeButton />}
				<LeverageButton />
			</div>

			{/* Order Type */}
			<OrderTypeTabs value={data.orderType} onChange={actions.setOrderType} />

			{/* Side Toggle */}
			<SideToggle value={data.side} onChange={actions.setSide} />

			{/* Available Info */}
			<AvailableInfo
				availableMargin={data.availableMargin}
				currentPosition={data.currentPosition}
				token={data.token}
			/>

			{/* Limit Price (only for limit orders) */}
			{data.orderType === 'limit' && (
				<PriceInput
					value={data.limitPrice}
					onChange={actions.setLimitPrice}
					label="Limit Price"
					maxDecimals={data.priceDecimals}
				/>
			)}

			{/* Size Input */}
			<SizeInput
				value={data.size}
				onChange={actions.setSize}
				denom={data.sizeDenom}
				onDenomChange={actions.setSizeDenom}
				token={data.token}
				szDecimals={data.szDecimals}
			/>

			{/* Size Slider */}
			<SizeSlider
				value={data.sliderPercent}
				onChange={actions.setSliderPercent}
			/>

			{/* Reduce Only */}
			<ReduceOnlyCheckbox
				checked={data.reduceOnly}
				onChange={actions.setReduceOnly}
			/>

			{/* TP/SL */}
			<TpslSection enabled={data.tpslEnabled} onToggle={actions.toggleTpsl}>
				<TpInput
					price={data.tpPrice}
					gain={data.tpGain}
					onPriceChange={actions.setTpPrice}
					onGainChange={actions.setTpGain}
					toggle={data.tpToggle}
					onToggleChange={actions.setTpToggle}
					maxDecimals={data.priceDecimals}
				/>
				<SlInput
					price={data.slPrice}
					loss={data.slLoss}
					onPriceChange={actions.setSlPrice}
					onLossChange={actions.setSlLoss}
					toggle={data.slToggle}
					onToggleChange={actions.setSlToggle}
					maxDecimals={data.priceDecimals}
				/>
			</TpslSection>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Submit */}
			<SubmitButton
				state={data.submitState}
				label={data.submitLabel}
				side={data.side}
				isSubmitting={data.isSubmitting}
				onClick={actions.handleSubmit}
			/>

			{/* Info Footer */}
			<OrderInfoFooter info={data.info} />
		</div>
	);
}
