export interface PressPublishPayload {
	name: string;
	slug: string;

	content: string;

	status?: string;
	visibility?: string;
}