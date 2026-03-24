import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { Toaster } from 'sonner';
import { PrivyProvider } from '@/providers/privy-provider';
import { DexProvider } from '@/providers/dex-provider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PrivyProvider>
			<Provider>
				<DexProvider>
					<App />
					<Toaster
						theme="dark"
						position="bottom-right"
						toastOptions={{
							className:
								'!bg-card !border !border-border !text-foreground !shadow-lg !rounded-md !text-xs',
							classNames: {
								success: '!text-green-400',
								error: '!text-red-400',
								warning: '!text-yellow-400',
							},
						}}
					/>
				</DexProvider>
			</Provider>
		</PrivyProvider>
	</StrictMode>,
);
