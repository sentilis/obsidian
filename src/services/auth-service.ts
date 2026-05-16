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
			return null;
		}

		return result.data;
	}
}