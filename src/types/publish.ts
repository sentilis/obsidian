export interface PressPublishPayload {
	name: string;
	slug: string;
	content: string;
	status?: string;
	visibility?: string;
	tags?: string[];
	authors?: string[];
	image?: string | null;
}