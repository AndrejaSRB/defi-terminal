import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { DexProvider } from '@/providers/dex-provider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider>
			<DexProvider>
				<App />
			</DexProvider>
		</Provider>
	</StrictMode>,
);
