import {
	App,
	Modal,
	Setting,
} from 'obsidian';

export interface ConfirmModalOptions {
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel: string;
	danger?: boolean;
	onConfirm: () => void | Promise<void>;
}

export class ConfirmModal extends Modal {
	private opts: ConfirmModalOptions;

	constructor(
		app: App,
		opts: ConfirmModalOptions
	) {
		super(app);

		this.opts = opts;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		this.titleEl.setText(
			this.opts.title
		);

		contentEl.createEl('p', {
			text: this.opts.message,
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(
						this.opts.cancelLabel
					)
					.onClick(() => {
						this.close();
					})
			)
			.addButton((btn) => {
				btn.setButtonText(
					this.opts.confirmLabel
				).onClick(async () => {
					this.close();

					await this.opts.onConfirm();
				});

				if (this.opts.danger) {
					btn.setWarning();
				}
			});
	}

	onClose() {
		this.contentEl.empty();
	}
}
