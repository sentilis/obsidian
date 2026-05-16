export function statusIconName(
	status: string | undefined | null
): string {
	switch ((status || '').toLowerCase()) {
		case 'published':
			return 'check-circle-2';
		case 'draft':
			return 'circle-dashed';
		case 'archived':
			return 'archive';
		default:
			return 'circle';
	}
}

export function statusIconClass(
	status: string | undefined | null
): string {
	return `sentilis-status-icon sentilis-status-${(
		status || 'unknown'
	).toLowerCase()}`;
}

export function visibilityIconName(
	visibility: string | undefined | null
): string {
	switch ((visibility || '').toLowerCase()) {
		case 'public':
			return 'globe';
		case 'private':
			return 'lock';
		case 'protected':
			return 'shield';
		case 'prime':
			return 'crown';
		default:
			return 'circle';
	}
}

export function visibilityIconClass(
	visibility: string | undefined | null
): string {
	return `sentilis-visibility-icon sentilis-visibility-${(
		visibility || 'unknown'
	).toLowerCase()}`;
}
