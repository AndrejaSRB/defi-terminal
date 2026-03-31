import type {
	ChartData,
	ChartMetaInfo,
	ChartTemplate,
	ChartTemplateContent,
	IExternalSaveLoadAdapter,
	LineToolsAndGroupsLoadRequestContext,
	LineToolsAndGroupsLoadRequestType,
	LineToolsAndGroupsState,
	StudyTemplateData,
	StudyTemplateMetaInfo,
} from '@charting_library/charting_library';

const KEYS = {
	charts: 'tv_charts',
	chartContent: 'tv_chart_content',
	studyTemplates: 'tv_study_templates',
	drawingTemplates: 'tv_drawing_templates',
	chartTemplates: 'tv_chart_templates',
	lineTools: 'tv_line_tools',
} as const;

function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.warn('[ChartStorage] Failed to write to localStorage:', e);
	}
}

let nextId = Date.now();

export class LocalStorageSaveLoadAdapter implements IExternalSaveLoadAdapter {
	async getAllCharts(): Promise<ChartMetaInfo[]> {
		return read<ChartMetaInfo[]>(KEYS.charts, []);
	}

	async removeChart(id: string | number): Promise<void> {
		const charts = read<ChartMetaInfo[]>(KEYS.charts, []);
		write(
			KEYS.charts,
			charts.filter((c) => String(c.id) !== String(id)),
		);
		const content = read<Record<string, string>>(KEYS.chartContent, {});
		delete content[String(id)];
		write(KEYS.chartContent, content);
	}

	async saveChart(chartData: ChartData): Promise<string> {
		console.log(
			'[ChartStorage] saveChart called:',
			chartData.name,
			chartData.id,
		);
		const charts = read<ChartMetaInfo[]>(KEYS.charts, []);
		const content = read<Record<string, string>>(KEYS.chartContent, {});

		const id = String(chartData.id ?? nextId++);

		const meta: ChartMetaInfo = {
			id,
			name: chartData.name,
			symbol: chartData.symbol,
			resolution: chartData.resolution,
			timestamp: Date.now(),
		};

		const existing = charts.findIndex((c) => String(c.id) === id);
		if (existing >= 0) {
			charts[existing] = meta;
		} else {
			charts.push(meta);
		}

		content[id] = chartData.content;

		write(KEYS.charts, charts);
		write(KEYS.chartContent, content);

		return id;
	}

	async getChartContent(chartId: string | number): Promise<string> {
		const content = read<Record<string, string>>(KEYS.chartContent, {});
		return content[String(chartId)] ?? '';
	}

	async getAllStudyTemplates(): Promise<StudyTemplateMetaInfo[]> {
		return read<StudyTemplateMetaInfo[]>(KEYS.studyTemplates, []);
	}

	async removeStudyTemplate(info: StudyTemplateMetaInfo): Promise<void> {
		const templates = read<(StudyTemplateMetaInfo & { content?: string })[]>(
			KEYS.studyTemplates,
			[],
		);
		write(
			KEYS.studyTemplates,
			templates.filter((t) => t.name !== info.name),
		);
	}

	async saveStudyTemplate(data: StudyTemplateData): Promise<void> {
		const templates = read<(StudyTemplateMetaInfo & { content?: string })[]>(
			KEYS.studyTemplates,
			[],
		);
		const existing = templates.findIndex((t) => t.name === data.name);
		const entry = { name: data.name, content: data.content };
		if (existing >= 0) {
			templates[existing] = entry;
		} else {
			templates.push(entry);
		}
		write(KEYS.studyTemplates, templates);
	}

	async getStudyTemplateContent(info: StudyTemplateMetaInfo): Promise<string> {
		const templates = read<(StudyTemplateMetaInfo & { content?: string })[]>(
			KEYS.studyTemplates,
			[],
		);
		return templates.find((t) => t.name === info.name)?.content ?? '';
	}

	async getAllChartTemplates(): Promise<string[]> {
		const templates = read<Record<string, ChartTemplateContent>>(
			KEYS.chartTemplates,
			{},
		);
		return Object.keys(templates);
	}

	async saveChartTemplate(
		templateName: string,
		content: ChartTemplateContent,
	): Promise<void> {
		const templates = read<Record<string, ChartTemplateContent>>(
			KEYS.chartTemplates,
			{},
		);
		templates[templateName] = content;
		write(KEYS.chartTemplates, templates);
	}

	async removeChartTemplate(templateName: string): Promise<void> {
		const templates = read<Record<string, ChartTemplateContent>>(
			KEYS.chartTemplates,
			{},
		);
		delete templates[templateName];
		write(KEYS.chartTemplates, templates);
	}

	async getChartTemplateContent(templateName: string): Promise<ChartTemplate> {
		const templates = read<Record<string, ChartTemplateContent>>(
			KEYS.chartTemplates,
			{},
		);
		return { content: templates[templateName] } as ChartTemplate;
	}

	async getDrawingTemplates(toolName: string): Promise<string[]> {
		const all = read<Record<string, Record<string, string>>>(
			KEYS.drawingTemplates,
			{},
		);
		return Object.keys(all[toolName] ?? {});
	}

	async removeDrawingTemplate(
		toolName: string,
		templateName: string,
	): Promise<void> {
		const all = read<Record<string, Record<string, string>>>(
			KEYS.drawingTemplates,
			{},
		);
		if (all[toolName]) {
			delete all[toolName][templateName];
			write(KEYS.drawingTemplates, all);
		}
	}

	async saveDrawingTemplate(
		toolName: string,
		templateName: string,
		content: string,
	): Promise<void> {
		const all = read<Record<string, Record<string, string>>>(
			KEYS.drawingTemplates,
			{},
		);
		if (!all[toolName]) all[toolName] = {};
		all[toolName][templateName] = content;
		write(KEYS.drawingTemplates, all);
	}

	async loadDrawingTemplate(
		toolName: string,
		templateName: string,
	): Promise<string> {
		const all = read<Record<string, Record<string, string>>>(
			KEYS.drawingTemplates,
			{},
		);
		return all[toolName]?.[templateName] ?? '';
	}

	async saveLineToolsAndGroups(
		_layoutId: string | undefined,
		chartId: string | number,
		state: LineToolsAndGroupsState,
	): Promise<void> {
		console.log(
			'[ChartStorage] saveLineToolsAndGroups called:',
			chartId,
			state,
		);
		const all = read<Record<string, LineToolsAndGroupsState>>(
			KEYS.lineTools,
			{},
		);
		all[String(chartId)] = state;
		write(KEYS.lineTools, all);
	}

	async loadLineToolsAndGroups(
		_layoutId: string | undefined,
		chartId: string | number,
		_requestType: LineToolsAndGroupsLoadRequestType,
		_requestContext: LineToolsAndGroupsLoadRequestContext,
	): Promise<Partial<LineToolsAndGroupsState> | null> {
		console.log('[ChartStorage] loadLineToolsAndGroups called:', chartId);
		const all = read<Record<string, LineToolsAndGroupsState>>(
			KEYS.lineTools,
			{},
		);
		return all[String(chartId)] ?? null;
	}
}
