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
