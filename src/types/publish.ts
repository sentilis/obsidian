import type {
	LifecycleStatus,
	LifecycleVisibility,
} from '@sentilis/core';

export interface PressPublishPayload {
	name: string;
	slug: string;
	content: string;
	status: LifecycleStatus;
	visibility: LifecycleVisibility;
	tags: string[];
	authors: string[];
	image: string | null;
}
