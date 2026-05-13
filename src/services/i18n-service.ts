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
			translations[
				obsidianLanguage
			]
				? obsidianLanguage
				: 'en';

		const keys = key.split('.');

		let value: any =
			translations[language];

		for (const k of keys) {
			value = value?.[k];
		}

		if (!value) {
			return key;
		}

		return value;
	}
}