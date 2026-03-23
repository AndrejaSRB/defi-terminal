'use client';

import type { CSSProperties } from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

function ResizablePanelGroup({
	className,
	...props
}: ResizablePrimitive.GroupProps) {
	return (
		<ResizablePrimitive.Group
			data-slot="resizable-panel-group"
			className={cn('flex h-full w-full', className)}
			{...props}
		/>
	);
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
	return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
	className,
	style,
	...props
}: ResizablePrimitive.SeparatorProps & { style?: CSSProperties }) {
	return (
		<ResizablePrimitive.Separator
			data-slot="resizable-handle"
			className={cn(
				'hover:bg-primary/50 transition-colors focus-visible:outline-hidden',
				className,
			)}
			style={{
				touchAction: 'none',
				userSelect: 'none',
				...style,
			}}
			{...props}
		/>
	);
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
