import {
	App,
	Modal,
	Notice,
} from 'obsidian';

import { PressDetailItem } from '../types/content';
import { SentilisPluginInterface } from '../types/plugin';

export class PressDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	pressId: string;

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		pressId: string
	) {
		super(app);

		this.plugin = plugin;
		this.pressId = pressId;
	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl('h2', {
			text: this.plugin.t(
				'pressDetail.loading'
			),
		});

		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			new Notice(
				this.plugin.t(
					'pressDetail.noProfile'
				)
			);

			this.close();

			return;
		}

		const result =
			await this.plugin.apiClient.getPressDetail(
				profile.token,
				this.pressId
			);

		contentEl.empty();

		if (
			!result.success ||
			!result.data
		) {
			contentEl.createEl('p', {
				text:
					result.error ||
					this.plugin.t(
						'pressDetail.failedLoad'
					),
			});

			return;
		}

		const item: PressDetailItem =
			result.data;

		contentEl.createEl('h2', {
			text: item.name,
		});

		contentEl.createEl('p', {
			text: `${this.plugin.t(
				'pressDetail.status'
			)}: ${item.status}`,
		});

		contentEl.createEl('p', {
			text: `${this.plugin.t(
				'pressDetail.visibility'
			)}: ${item.visibility}`,
		});

		if (item.category) {
			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'pressDetail.category'
				)}: ${item.category}`,
			});
		}

		if (item.createdAt) {
			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'pressDetail.createdAt'
				)}: ${new Date(
					item.createdAt
				).toLocaleString()}`,
			});
		}

		if (item.url) {
			const linkEl =
				contentEl.createEl('a', {
					text: this.plugin.t(
						'pressDetail.openUrl'
					),

					href: item.url,
				});

			linkEl.target = '_blank';
		}

		if (
			item.children &&
			item.children.length > 0
		) {
			contentEl.createEl('h3', {
				text: this.plugin.t(
					'pressDetail.children'
				),
			});

			item.children.forEach(
				(child) => {
					const childEl =
						contentEl.createDiv({
							cls: 'sentilis-child-item',
						});

					childEl.createEl('strong', {
						text: child.name,
					});

					childEl.createEl('small', {
						text: `${child.status ?? ''} ${
							child.visibility ?? ''
						}`,
					});
				}
			);
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}