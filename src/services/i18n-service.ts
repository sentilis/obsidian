import { moment } from 'obsidian';

import { translations } from '../i18n/translations';

import { SentilisPluginInterface } from '../types/plugin';

export class I18nService {
	plugin: SentilisPluginInterface;

	constructor(
		plugin: SentilisPluginInterface
	) {
		this.plugin = plugin;
	}

	t(key: string): string {
		const obsidianLanguage =
			moment.locale();

		const language =
			translations[obsidianLanguage as keyof typeof translations]
				? obsidianLanguage
				: 'en';

		const keys = key.split('.');

		let value: unknown =
			translations[language as keyof typeof translations];

		for (const k of keys) {
			if (
				typeof value === 'object' &&
				value !== null &&
				k in value
			) {
				value = (value as Record<string, unknown>)[k];
			} else {
				return key;
			}
		}

		return typeof value === 'string'
			? value
			: key;
	}
}
