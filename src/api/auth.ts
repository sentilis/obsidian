export function basicAuth(
	token: string
): string {
	return `Basic ${btoa(`:${token}`)}`;
}