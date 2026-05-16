export interface SentilisAction {
	id: string;
	title: string;
	description?: string;

	onClick: () => void | Promise<void>;
}