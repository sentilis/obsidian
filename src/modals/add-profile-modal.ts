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
		onSave: () => void,
	) {
		super(app);

		this.plugin = plugin;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl('h2', {
			text: 'Add Sentilis Profile',
		});

		new Setting(contentEl)
			.setName('Access Token')
			.addText((text) => {
				text.onChange((value) => {
					this.token = value;
				});
			});

		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.token) {
						new Notice(
							'Please complete all fields'
						);

						return;
					}

					const username = await this.plugin.authService.authenticateToken(
						this.token
					);

					if (!username) {
						return;
					}

					await this.plugin.profileService.addProfile(
						username,
						this.token
					);

					this.onSave();

					this.close();
				});
		});
	}

	onClose() {
		const { contentEl } = this;

		contentEl.empty();
	}
}