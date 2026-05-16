import { Notice } from 'obsidian';

import { SentilisProfile } from './types';
import { SentilisPluginInterface } from '../plugin';

export class ProfileService {
	plugin: SentilisPluginInterface;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;
	}

	async addProfile(
		username: string,
		token: string
	): Promise<SentilisProfile> {
		const profile: SentilisProfile = {
			id: crypto.randomUUID(),
			username,
			token,
		};

		this.plugin.settings.profiles.push(profile);

		if (
			!this.plugin.settings.defaultProfileId
		) {
			this.plugin.settings.defaultProfileId =
				profile.id;
		}

		await this.plugin.saveSettings();

		new Notice(
			'Profile added successfully'
		);

		return profile;
	}

	async deleteProfile(
		profileId: string
	): Promise<void> {
		this.plugin.settings.profiles =
			this.plugin.settings.profiles.filter(
				(profile) =>
					profile.id !== profileId
			);

		if (
			this.plugin.settings.defaultProfileId ===
			profileId
		) {
			this.plugin.settings.defaultProfileId =
				null;
		}

		await this.plugin.saveSettings();

		new Notice('Profile deleted');
	}

	async setDefaultProfile(
		profileId: string
	): Promise<void> {
		this.plugin.settings.defaultProfileId =
			profileId;

		await this.plugin.saveSettings();
	}
}
