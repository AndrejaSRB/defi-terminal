import { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutTab } from './layout-tab';
import { ThemesTab } from './themes-tab';

export function SettingsDialog() {
	const [open, setOpen] = useState(false);

	const handleOpen = useCallback(() => setOpen(true), []);

	return (
		<>
			<Button
				size="icon"
				variant="ghost"
				onClick={handleOpen}
				className="size-8"
			>
				<Settings className="size-4" />
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader className="text-left">
						<DialogTitle>Settings</DialogTitle>
						<DialogDescription>
							Customize your terminal layout and appearance.
						</DialogDescription>
					</DialogHeader>

					<Tabs defaultValue="layout">
						<TabsList variant="line" className="w-full">
							<TabsTrigger value="layout">Layout</TabsTrigger>
							<TabsTrigger value="themes">Themes</TabsTrigger>
						</TabsList>
						<TabsContent value="layout" className="mt-4">
							<LayoutTab />
						</TabsContent>
						<TabsContent value="themes" className="mt-4">
							<ThemesTab />
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</>
	);
}
