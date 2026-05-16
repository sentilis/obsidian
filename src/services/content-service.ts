import {
	PressItem,
	ProductItem,
} from '../types/content';
import { SentilisPluginInterface } from '../types/plugin';

export class ContentService {
	plugin: SentilisPluginInterface;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;
	}

	async getRecentPress(): Promise<
		PressItem[]
	> {
		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			return [];
		}

		const result =
			await this.plugin.apiClient.getPressList(
				profile.token
			);

		if (
			!result.success ||
			!result.data
		) {
			return [];
		}

		return result.data;
	}

	async getRecentProducts(): Promise<
		ProductItem[]
	> {
		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			return [];
		}

		const result =
			await this.plugin.apiClient.getMarketList(
				profile.token
			);

		if (
			!result.success ||
			!result.data
		) {
			return [];
		}

		return result.data;
	}
}