import { Notice } from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';

export class AuthService {
	plugin: SentilisPluginInterface;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;
	}

	async authenticateToken(
		token: string
	): Promise<string | null> {
		const result =
			await this.plugin.apiClient.validateToken(
				token
			);

		if (
			!result.success ||
			!result.data
		) {
			new Notice(
				result.error ||
					'Authentication failed'
			);

			return null;
		}

		return result.data;
	}
}