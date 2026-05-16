import {
	App,
	Notice,
	SuggestModal,
} from 'obsidian';

import { SentilisProfile } from '../settings/types';
import { SentilisPluginInterface } from '../types/plugin';
import { SENTILIS_EVENTS } from '../constants/events';

export class ProfileSwitcherModal extends SuggestModal<SentilisProfile> {
	plugin: SentilisPluginInterface;

	constructor(
		app: App,
		plugin: SentilisPluginInterface
	) {
		super(app);

		this.plugin = plugin;

		this.setPlaceholder(
			'Select active Sentilis profile'
		);
	}

	getSuggestions(
		query: string
	): SentilisProfile[] {
		return this.plugin.settings.profiles.filter(
			(profile) =>
				profile.username
					.toLowerCase()
					.includes(
						query.toLowerCase()
					)
		);
	}

	renderSuggestion(
		profile: SentilisProfile,
		el: HTMLElement
	) {
		el.createEl('div', {
			text: profile.username,
		});

		if (
			profile.id ===
			this.plugin.settings
				.defaultProfileId
		) {
			el.createEl('small', {
				text: this.plugin.t(
					'settings.active_user'
				),
				cls: 'sentilis-active-profile-badge',
			});
		}
	}

	async onChooseSuggestion(
		profile: SentilisProfile
	) {
		await this.plugin.profileService.setDefaultProfile(
			profile.id
		);

		this.app.workspace.trigger(
			SENTILIS_EVENTS.PROFILE_CHANGED
		);

		new Notice(
			`Active profile changed to ${profile.username}`
		);
	}
}