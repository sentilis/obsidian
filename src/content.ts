import { RestClient } from '@sentilis/core';

import { PressItem } from './press/types';
import { ProductItem } from './market/types';
import { BioItem } from './bio/types';
import { SentilisPluginInterface } from './plugin';

export class ContentService {
	plugin: SentilisPluginInterface;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;
	}

	async getRecentPress(): Promise<PressItem[]> {
		const profile = this.plugin.getCurrentProfile();
		if (!profile) return [];

		try {
			const res = await new RestClient(profile.token).listPress({
				visibility: ['public', 'private', 'protected', 'prime'],
			});
			return res.data;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async getRecentProducts(): Promise<ProductItem[]> {
		const profile = this.plugin.getCurrentProfile();
		if (!profile) return [];

		try {
			const res = await new RestClient(profile.token).listProduct();
			return res.data;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async getRecentBios(): Promise<BioItem[]> {
		const profile = this.plugin.getCurrentProfile();
		if (!profile) return [];

		try {
			const res = await new RestClient(profile.token).listBio({
				visibility: ['public', 'private', 'protected', 'prime'],
			});
			return res.data;
		} catch (error) {
			console.error(error);
			return [];
		}
	}
}
