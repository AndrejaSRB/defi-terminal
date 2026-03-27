import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { cn } from '@/lib/utils';
import {
	themeAtom,
	THEME_PRESETS,
	type ThemeId,
	type ThemePreset,
} from '@/atoms/settings';

function ThemePreviewCard({
	preset,
	isActive,
	onSelect,
}: {
	preset: ThemePreset;
	isActive: boolean;
	onSelect: (themeId: ThemeId) => void;
}) {
	const handleClick = useCallback(() => {
		onSelect(preset.id);
	}, [preset.id, onSelect]);

	const { primary, background, card, foreground, muted } = preset.colors;

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				'group flex flex-col overflow-hidden rounded-lg border-2 transition-all',
				isActive
					? 'border-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]'
					: 'border-border hover:border-muted-foreground/40',
			)}
		>
			{/* Mini terminal mockup */}
			<div
				className="flex h-24 flex-col gap-0.5 p-1.5"
				style={{ backgroundColor: background }}
			>
				{/* Top bar */}
				<div
					className="flex h-2.5 items-center justify-end gap-1 rounded-sm px-1"
					style={{ backgroundColor: card }}
				>
					<div
						className="size-1.5 rounded-full"
						style={{ backgroundColor: primary }}
					/>
					<div
						className="size-1.5 rounded-full"
						style={{ backgroundColor: muted }}
					/>
				</div>

				{/* Main area */}
				<div className="flex flex-1 gap-0.5">
					{/* Chart area */}
					<div
						className="flex flex-1 flex-col justify-end rounded-sm p-1"
						style={{ backgroundColor: card }}
					>
						{/* Mini chart lines */}
						<div className="flex items-end gap-px">
							{[40, 60, 35, 75, 55, 65, 80, 50].map((height, index) => (
								<div
									key={index}
									className="flex-1 rounded-t-sm"
									style={{
										height: `${height}%`,
										backgroundColor: primary,
										opacity: 0.6,
									}}
								/>
							))}
						</div>
					</div>

					{/* Right panel */}
					<div
						className="flex w-1/4 flex-col gap-0.5 rounded-sm p-1"
						style={{ backgroundColor: card }}
					>
						<div
							className="h-1 rounded-full"
							style={{ backgroundColor: muted, width: '80%' }}
						/>
						<div
							className="h-1 rounded-full"
							style={{ backgroundColor: muted, width: '60%' }}
						/>
						<div className="mt-auto flex gap-0.5">
							<div
								className="h-1.5 flex-1 rounded-sm"
								style={{ backgroundColor: '#4ade80' }}
							/>
							<div
								className="h-1.5 flex-1 rounded-sm"
								style={{ backgroundColor: '#f87171' }}
							/>
						</div>
					</div>
				</div>

				{/* Bottom bar */}
				<div
					className="flex h-2 items-center rounded-sm px-1"
					style={{ backgroundColor: card }}
				>
					<div
						className="h-1 w-2/3 rounded-full"
						style={{ backgroundColor: muted }}
					/>
				</div>
			</div>

			{/* Label */}
			<div
				className="px-2 py-1.5 text-xs font-medium"
				style={{ backgroundColor: card, color: foreground }}
			>
				{preset.name}
			</div>
		</button>
	);
}

export function ThemesTab() {
	const [currentTheme, setTheme] = useAtom(themeAtom);

	const handleSelect = useCallback(
		(themeId: ThemeId) => {
			setTheme(themeId);
		},
		[setTheme],
	);

	return (
		<div className="space-y-3">
			<p className="text-xs text-muted-foreground">
				Choose a color theme for the terminal.
			</p>
			<div className="grid grid-cols-3 gap-3">
				{THEME_PRESETS.map((preset) => (
					<ThemePreviewCard
						key={preset.id}
						preset={preset}
						isActive={currentTheme === preset.id}
						onSelect={handleSelect}
					/>
				))}
			</div>
		</div>
	);
}
