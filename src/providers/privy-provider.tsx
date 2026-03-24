import { PrivyProvider as Privy } from '@privy-io/react-auth';

const appId = import.meta.env.VITE_PRIVY_APP_ID as string;

export function PrivyProvider({ children }: { children: React.ReactNode }) {
	return (
		<Privy
			appId={appId}
			config={{
				appearance: {
					theme: 'dark',
				},
				embeddedWallets: {
					ethereum: {
						createOnLogin: 'users-without-wallets',
					},
				},
			}}
		>
			{children}
		</Privy>
	);
}
