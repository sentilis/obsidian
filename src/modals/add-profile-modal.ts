import {
	App,
	Modal,
	Notice,
	Setting,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';

export class AddProfileModal extends Modal {
	plugin: SentilisPluginInterface;

	onSave: () => void;

	token: string = '';

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		onSave: () => void
	) {
		super(app);

		this.plugin = plugin;

		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl('h2', {
			text: this.plugin.t(
				'addProfile.title'
			),
		});

		new Setting(contentEl)
			.setName(
				this.plugin.t(
					'addProfile.accessToken'
				)
			)
			.addText((text) => {
				text.onChange((value) => {
					this.token = value.trim();
				});
			});

		new Setting(contentEl).addButton(
			(button) => {
				button
					.setButtonText(
						this.plugin.t(
							'addProfile.save'
						)
					)
					.setCta()
					.onClick(async () => {
						if (!this.token) {
							new Notice(
								this.plugin.t(
									'addProfile.completeFields'
								)
							);

							return;
						}

						const tokenExists =
							this.plugin.settings.profiles.some(
								(profile) =>
									profile.token ===
									this.token
							);

						if (tokenExists) {
							new Notice(
								this.plugin.t(
									'addProfile.tokenAlreadyExists'
								)
							);

							return;
						}

						const username =
							await this.plugin.authService.authenticateToken(
								this.token
							);

						if (!username) {
							new Notice(
								this.plugin.t(
									'addProfile.invalidToken'
								)
							);

							return;
						}

						await this.plugin.profileService.addProfile(
							username,
							this.token
						);

						new Notice(
							this.plugin.t(
								'addProfile.profileAdded'
							)
						);

						this.onSave();

						this.close();
					});
			}
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}