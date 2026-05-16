import {
	App,
	SuggestModal,
} from 'obsidian';

import { SentilisAction } from '../types/actions';

export class ActionModal extends SuggestModal<SentilisAction> {
	actions: SentilisAction[];

	constructor(
		app: App,
		actions: SentilisAction[]
	) {
		super(app);

		this.actions = actions;

		this.setPlaceholder(
			'Select Sentilis action'
		);
	}

	getSuggestions(
		query: string
	): SentilisAction[] {
		return this.actions.filter(
			(action) =>
				action.title
					.toLowerCase()
					.includes(
						query.toLowerCase()
					)
		);
	}

	renderSuggestion(
		action: SentilisAction,
		el: HTMLElement
	) {
		el.createEl('div', {
			text: action.title,
		});

		if (action.description) {
			el.createEl('small', {
				text: action.description,
			});
		}
	}

	onChooseSuggestion(
		action: SentilisAction
	) {
		void action.onClick();
	}
}