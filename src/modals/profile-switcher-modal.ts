import {
	App,
	Notice,
	setIcon,
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
			this.plugin.t(
				'settings.changeProfile'
			)
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
		el.addClass(
			'sentilis-profile-suggestion'
		);

		const isActive =
			profile.id ===
			this.plugin.settings
				.defaultProfileId;

		if (isActive) {
			const iconEl = el.createSpan({
				cls: 'sentilis-active-icon',
				attr: {
					'aria-label':
						this.plugin.t(
							'settings.active'
						),
					title: this.plugin.t(
						'settings.active'
					),
				},
			});

			setIcon(
				iconEl,
				'check-circle-2'
			);
		}

		el.createSpan({
			text: profile.username,
		});
	}

	onChooseSuggestion(
		profile: SentilisProfile
	): void {
		void (async () => {
			await this.plugin.profileService.setDefaultProfile(
				profile.id
			);

			this.app.workspace.trigger(
				SENTILIS_EVENTS.PROFILE_CHANGED
			);

			new Notice(
				`Active profile: ${profile.username}`
			);
		})();
	}
}