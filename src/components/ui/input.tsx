import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({
	className,
	type = 'text',
	...props
}: React.ComponentProps<'input'>) {
	return (
		<input
			data-slot="input"
			type={type}
			className={cn(
				'flex h-8 w-full rounded-md border border-border bg-transparent px-2.5 text-sm text-foreground transition-colors',
				'placeholder:text-muted-foreground',
				'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
