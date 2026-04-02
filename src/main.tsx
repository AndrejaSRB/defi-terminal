import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: false, refetchOnWindowFocus: false },
	},
});
import { PrivyProvider } from '@/providers/privy-provider';
import { DexProvider } from '@/providers/dex-provider';
import { ensureLifiSdk } from '@/services/lifi/client';
import { router } from './routes';
import './index.css';

// Initialize LiFi SDK before any service calls
ensureLifiSdk();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PrivyProvider>
			<Provider>
				<QueryClientProvider client={queryClient}>
					<DexProvider>
						<RouterProvider router={router} />
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
				</QueryClientProvider>
			</Provider>
		</PrivyProvider>
	</StrictMode>,
);
